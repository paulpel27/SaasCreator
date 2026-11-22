import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  TableDefinition, 
  ForeignKeyRelationship, 
  FieldDefinition 
} from '../types';
import { 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Filter, 
  Download, 
  Key, 
  Link2, 
  Layers, 
  Info, 
  Plus, 
  Edit3, 
  Trash2,
  Sparkles,
  ArrowRight,
  Eye,
  Settings,
  HelpCircle
} from 'lucide-react';

interface D3SchemaMapProps {
  tables: TableDefinition[];
  onSelectTable?: (tableId: string) => void;
  onEditTable?: (table: TableDefinition) => void;
  onCreateRelationship?: (sourceTableId: string, targetTableId: string) => void;
  onUpdateTablePosition?: (tableId: string, position: { x: number; y: number }) => void;
}

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  table: TableDefinition;
  width: number;
  height: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  id: string;
  source: NodeDatum | string;
  target: NodeDatum | string;
  sourceTableId: string;
  targetTableId: string;
  sourceFieldId: string;
  targetFieldId: string;
  sourceFieldName: string;
  targetFieldName: string;
  relationshipType: string;
  onDelete: string;
  description?: string;
  isLov: boolean;
}

export const D3SchemaMap: React.FC<D3SchemaMapProps> = ({
  tables,
  onSelectTable,
  onEditTable,
  onCreateRelationship,
  onUpdateTablePosition
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFieldTypes, setShowFieldTypes] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [collapsedTables, setCollapsedTables] = useState<Record<string, boolean>>({});
  const [activeLayout, setActiveLayout] = useState<'force' | 'grid' | 'hierarchical'>('force');

  // Compute graph data (nodes & links)
  const { nodes, links } = useMemo(() => {
    const nodeData: NodeDatum[] = tables.map((t, index) => {
      const isCollapsed = collapsedTables[t.id];
      const fieldCount = t.fields.length;
      const calculatedHeight = isCollapsed ? 64 : Math.min(340, 72 + fieldCount * 26 + 16);
      return {
        id: t.id,
        table: t,
        width: 250,
        height: calculatedHeight,
        x: t.position?.x ?? (200 + (index % 3) * 320),
        y: t.position?.y ?? (150 + Math.floor(index / 3) * 280)
      };
    });

    const linkData: LinkDatum[] = [];

    // 1. Explicit Foreign Keys
    tables.forEach((sourceTable) => {
      const fks = sourceTable.foreignKeys || [];
      fks.forEach((fk) => {
        const targetTable = tables.find((t) => t.id === fk.targetTableId);
        if (targetTable) {
          const sourceField = sourceTable.fields.find((f) => f.id === fk.sourceFieldId);
          const targetField = targetTable.fields.find((f) => f.id === fk.targetFieldId);
          linkData.push({
            id: fk.id,
            source: sourceTable.id,
            target: targetTable.id,
            sourceTableId: sourceTable.id,
            targetTableId: targetTable.id,
            sourceFieldId: fk.sourceFieldId,
            targetFieldId: fk.targetFieldId,
            sourceFieldName: sourceField?.label || sourceField?.name || 'FK',
            targetFieldName: targetField?.label || targetField?.name || 'PK',
            relationshipType: fk.relationshipType || 'many-to-one',
            onDelete: fk.onDelete || 'RESTRICT',
            description: fk.description,
            isLov: false
          });
        }
      });

      // 2. LOV Foreign Key fields (if not already represented by an explicit FK)
      sourceTable.fields.forEach((f) => {
        if (f.type === 'lov' && f.lovType === 'foreign_key' && f.foreignKeyTargetTable) {
          const targetTable = tables.find((t) => t.id === f.foreignKeyTargetTable);
          if (targetTable) {
            const alreadyExists = linkData.some(
              (l) => l.sourceTableId === sourceTable.id && l.targetTableId === targetTable.id && l.sourceFieldId === f.id
            );
            if (!alreadyExists) {
              const targetField = targetTable.fields.find((tf) => tf.id === f.foreignKeyTargetField) || targetTable.fields[0];
              linkData.push({
                id: `lov_fk_${sourceTable.id}_${f.id}_${targetTable.id}`,
                source: sourceTable.id,
                target: targetTable.id,
                sourceTableId: sourceTable.id,
                targetTableId: targetTable.id,
                sourceFieldId: f.id,
                targetFieldId: targetField?.id || 'pk',
                sourceFieldName: f.label || f.name,
                targetFieldName: targetField?.label || targetField?.name || 'ID',
                relationshipType: 'many-to-one',
                onDelete: 'RESTRICT',
                description: 'Lookup Relationship',
                isLov: true
              });
            }
          }
        }
      });

      // 3. Master-Detail relationship
      if (sourceTable.isDetailTable && sourceTable.masterTableId) {
        const masterTable = tables.find((t) => t.id === sourceTable.masterTableId);
        if (masterTable) {
          const alreadyExists = linkData.some(
            (l) => l.sourceTableId === sourceTable.id && l.targetTableId === masterTable.id
          );
          if (!alreadyExists) {
            linkData.push({
              id: `master_detail_${sourceTable.id}_${masterTable.id}`,
              source: sourceTable.id,
              target: masterTable.id,
              sourceTableId: sourceTable.id,
              targetTableId: masterTable.id,
              sourceFieldId: 'master_fk',
              targetFieldId: masterTable.primaryKeyFieldId || 'pk',
              sourceFieldName: 'Detail Items',
              targetFieldName: masterTable.label,
              relationshipType: 'many-to-one',
              onDelete: 'CASCADE',
              description: 'Master-Detail Parent Relationship',
              isLov: false
            });
          }
        }
      }
    });

    return { nodes: nodeData, links: linkData };
  }, [tables, collapsedTables]);

  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Main D3 Rendering Engine
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 700;

    svg.selectAll('*').remove();

    // Defs: Gradients, Filters, Markers
    const defs = svg.append('defs');

    // Arrow Marker - Regular FK
    defs.append('marker')
      .attr('id', 'arrow-fk')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L9,0L0,4')
      .attr('fill', '#4f46e5');

    // Arrow Marker - Highlighted
    defs.append('marker')
      .attr('id', 'arrow-fk-active')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4.5L10,0L0,4.5')
      .attr('fill', '#f59e0b');

    // Arrow Marker - Cascade
    defs.append('marker')
      .attr('id', 'arrow-cascade')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L9,0L0,4')
      .attr('fill', '#ec4899');

    // Shadow Filter
    const filter = defs.append('filter')
      .attr('id', 'drop-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    filter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '8')
      .attr('stdDeviation', '10')
      .attr('flood-color', '#0f172a')
      .attr('flood-opacity', '0.08');

    // Main Group with Zoom
    const g = svg.append('g').attr('class', 'main-canvas-group');

    // Background Grid
    const pattern = defs.append('pattern')
      .attr('id', 'grid-pattern')
      .attr('width', 32)
      .attr('height', 32)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('circle')
      .attr('cx', 2)
      .attr('cy', 2)
      .attr('r', 1.2)
      .attr('fill', '#cbd5e1');

    g.append('rect')
      .attr('width', 8000)
      .attr('height', 8000)
      .attr('x', -4000)
      .attr('y', -4000)
      .attr('fill', 'url(#grid-pattern)')
      .attr('opacity', 0.85);

    // Setup Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Initial Zoom Center
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2 - 380, height / 2 - 250).scale(0.85));

    // Force Simulation Setup
    const simulation = d3.forceSimulation<NodeDatum>(nodes)
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(links).id((d) => d.id).distance(300).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-900))
      .force('collision', d3.forceCollide().radius(180))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Links Layer
    const linkGroup = g.append('g').attr('class', 'links-group');
    const linksSelection = linkGroup.selectAll<SVGPathElement, LinkDatum>('path.link-path')
      .data(links, (d) => d.id)
      .enter()
      .append('path')
      .attr('class', 'link-path')
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        if (d.onDelete === 'CASCADE') return '#ec4899';
        if (d.isLov) return '#0ea5e9';
        return '#6366f1';
      })
      .attr('stroke-width', (d) => (d.id === hoveredLinkId ? 3.5 : 2))
      .attr('stroke-dasharray', (d) => (d.isLov ? '5,5' : 'none'))
      .attr('marker-end', (d) => {
        if (d.id === hoveredLinkId) return 'url(#arrow-fk-active)';
        if (d.onDelete === 'CASCADE') return 'url(#arrow-cascade)';
        return 'url(#arrow-fk)';
      })
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseenter', (_, d) => {
        setHoveredLinkId(d.id);
      })
      .on('mouseleave', () => {
        setHoveredLinkId(null);
      });

    // Link Labels (Cardinality Badge)
    const linkLabelGroup = g.append('g').attr('class', 'link-labels-group');
    const linkLabels = linkLabelGroup.selectAll<SVGGElement, LinkDatum>('g.link-badge')
      .data(links, (d) => d.id)
      .enter()
      .append('g')
      .attr('class', 'link-badge')
      .style('cursor', 'pointer');

    linkLabels.append('rect')
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('width', 52)
      .attr('height', 20)
      .attr('x', -26)
      .attr('y', -10)
      .attr('fill', (d) => (d.onDelete === 'CASCADE' ? '#fdf2f8' : '#eef2ff'))
      .attr('stroke', (d) => (d.onDelete === 'CASCADE' ? '#f472b6' : '#a5b4fc'))
      .attr('stroke-width', 1);

    linkLabels.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 3.5)
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', (d) => (d.onDelete === 'CASCADE' ? '#db2777' : '#4338ca'))
      .text((d) => (d.relationshipType === 'one-to-one' ? '1 : 1' : 'N : 1'));

    // Nodes Layer
    const nodeGroup = g.append('g').attr('class', 'nodes-group');
    const nodesSelection = nodeGroup.selectAll<SVGGElement, NodeDatum>('g.node')
      .data(nodes, (d) => d.id)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('filter', 'url(#drop-shadow)')
      .style('cursor', 'grab')
      .call(
        d3.drag<SVGGElement, NodeDatum>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            if (onUpdateTablePosition && d.fx !== undefined && d.fy !== undefined && d.fx !== null && d.fy !== null) {
              onUpdateTablePosition(d.id, { x: d.fx, y: d.fy });
            }
          })
      );

    // Node Container Box
    nodesSelection.append('rect')
      .attr('class', 'node-box')
      .attr('width', (d) => d.width)
      .attr('height', (d) => d.height)
      .attr('rx', 14)
      .attr('ry', 14)
      .attr('fill', '#ffffff')
      .attr('stroke', (d) => {
        if (d.id === selectedTableId) return '#4f46e5';
        if (d.id === hoveredTableId) return '#6366f1';
        if (d.table.isDetailTable) return '#f472b6';
        return '#e2e8f0';
      })
      .attr('stroke-width', (d) => (d.id === selectedTableId ? 2.5 : d.id === hoveredTableId ? 2 : 1.2));

    // Header Background
    nodesSelection.append('path')
      .attr('d', (d) => `M 0 14 Q 0 0 14 0 L ${d.width - 14} 0 Q ${d.width} 0 ${d.width} 14 L ${d.width} 44 L 0 44 Z`)
      .attr('fill', (d) => {
        if (d.table.isDetailTable) return '#fdf2f8';
        return '#f8fafc';
      })
      .attr('stroke', (d) => (d.table.isDetailTable ? '#fbcfe8' : '#e2e8f0'))
      .attr('stroke-width', 0.5);

    // Header Title
    nodesSelection.append('text')
      .attr('x', 14)
      .attr('y', 27)
      .attr('font-size', '13px')
      .attr('font-weight', '700')
      .attr('font-family', 'Plus Jakarta Sans, Outfit, sans-serif')
      .attr('fill', (d) => (d.table.isDetailTable ? '#9d174d' : '#0f172a'))
      .text((d) => (d.table.label.length > 20 ? d.table.label.slice(0, 18) + '...' : d.table.label));

    // Header Badge (Field Count / Detail status)
    nodesSelection.append('rect')
      .attr('x', (d) => d.width - 64)
      .attr('y', 14)
      .attr('width', 50)
      .attr('height', 18)
      .attr('rx', 9)
      .attr('fill', (d) => (d.table.isDetailTable ? '#fce7f3' : '#e0e7ff'))
      .attr('stroke', (d) => (d.table.isDetailTable ? '#f472b6' : '#c7d2fe'))
      .attr('stroke-width', 0.5);

    nodesSelection.append('text')
      .attr('x', (d) => d.width - 39)
      .attr('y', 26.5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9.5px')
      .attr('font-weight', '700')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', (d) => (d.table.isDetailTable ? '#be185d' : '#4338ca'))
      .text((d) => `${d.table.fields.length} col`);

    // Fields List inside each Node
    nodesSelection.each(function (d) {
      if (collapsedTables[d.id]) return;

      const nodeG = d3.select(this);
      const visibleFields = d.table.fields.slice(0, 9);

      visibleFields.forEach((field: FieldDefinition, i: number) => {
        const yOffset = 52 + i * 26;
        const isPk = field.id === d.table.primaryKeyFieldId || field.isPrimaryKey;
        const isFk = field.type === 'lov' && field.lovType === 'foreign_key';

        // Field Row Group
        const fieldG = nodeG.append('g')
          .attr('transform', `translate(0, ${yOffset})`)
          .style('cursor', 'pointer');

        // Field separator line
        if (i > 0) {
          fieldG.append('line')
            .attr('x1', 8)
            .attr('y1', 0)
            .attr('x2', d.width - 8)
            .attr('y2', 0)
            .attr('stroke', '#f1f5f9')
            .attr('stroke-width', 1);
        }

        // Icon indicator (PK / FK / Field)
        if (isPk) {
          fieldG.append('circle')
            .attr('cx', 16)
            .attr('cy', 12)
            .attr('r', 4.5)
            .attr('fill', '#f59e0b');

          fieldG.append('text')
            .attr('x', 26)
            .attr('y', 15.5)
            .attr('font-size', '11px')
            .attr('font-weight', '700')
            .attr('fill', '#0f172a')
            .attr('font-family', 'Plus Jakarta Sans, sans-serif')
            .text(field.label.length > 16 ? field.label.slice(0, 14) + '..' : field.label);
        } else if (isFk) {
          fieldG.append('circle')
            .attr('cx', 16)
            .attr('cy', 12)
            .attr('r', 4.5)
            .attr('fill', '#6366f1');

          fieldG.append('text')
            .attr('x', 26)
            .attr('y', 15.5)
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .attr('fill', '#334155')
            .attr('font-family', 'Plus Jakarta Sans, sans-serif')
            .text(field.label.length > 16 ? field.label.slice(0, 14) + '..' : field.label);
        } else {
          fieldG.append('circle')
            .attr('cx', 16)
            .attr('cy', 12)
            .attr('r', 3)
            .attr('fill', '#94a3b8');

          fieldG.append('text')
            .attr('x', 26)
            .attr('y', 15.5)
            .attr('font-size', '11px')
            .attr('font-weight', '500')
            .attr('fill', '#475569')
            .attr('font-family', 'Plus Jakarta Sans, sans-serif')
            .text(field.label.length > 16 ? field.label.slice(0, 14) + '..' : field.label);
        }

        // Data Type Badge on Right
        if (showFieldTypes) {
          fieldG.append('text')
            .attr('x', d.width - 12)
            .attr('y', 15.5)
            .attr('text-anchor', 'end')
            .attr('font-size', '9px')
            .attr('font-weight', '600')
            .attr('font-family', 'JetBrains Mono, monospace')
            .attr('fill', isPk ? '#d97706' : isFk ? '#4f46e5' : '#64748b')
            .text(isPk ? 'PK • autoid' : isFk ? 'FK • rel' : field.type);
        }
      });

      if (d.table.fields.length > 9) {
        nodeG.append('text')
          .attr('x', d.width / 2)
          .attr('y', d.height - 8)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9.5px')
          .attr('fill', '#94a3b8')
          .attr('font-weight', '600')
          .text(`+ ${d.table.fields.length - 9} more fields`);
      }
    });

    // Node Interactions
    nodesSelection
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedTableId(d.id);
        if (onSelectTable) onSelectTable(d.id);
      })
      .on('mouseenter', (_, d) => {
        setHoveredTableId(d.id);
      })
      .on('mouseleave', () => {
        setHoveredTableId(null);
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        if (onEditTable) onEditTable(d.table);
      });

    // Canvas click resets selection
    svg.on('click', () => {
      setSelectedTableId(null);
    });

    // Simulation Tick Updates
    simulation.on('tick', () => {
      nodesSelection.attr('transform', (d) => `translate(${(d.x || 0) - d.width / 2}, ${(d.y || 0) - d.height / 2})`);

      linksSelection.attr('d', (d) => {
        const sourceNode = d.source as NodeDatum;
        const targetNode = d.target as NodeDatum;

        const sx = sourceNode.x || 0;
        const sy = sourceNode.y || 0;
        const tx = targetNode.x || 0;
        const ty = targetNode.y || 0;

        // Calculate smooth cubic bezier connection between node edges
        const dx = tx - sx;
        const dy = ty - sy;

        const p1x = sx + (dx > 0 ? sourceNode.width / 2 : -sourceNode.width / 2);
        const p1y = sy;
        const p2x = tx + (dx > 0 ? -targetNode.width / 2 : targetNode.width / 2);
        const p2y = ty;

        const cx1 = p1x + (dx > 0 ? 80 : -80);
        const cy1 = p1y;
        const cx2 = p2x + (dx > 0 ? -80 : 80);
        const cy2 = p2y;

        return `M ${p1x} ${p1y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2x} ${p2y}`;
      });

      linkLabels.attr('transform', (d) => {
        const sourceNode = d.source as NodeDatum;
        const targetNode = d.target as NodeDatum;
        const midX = ((sourceNode.x || 0) + (targetNode.x || 0)) / 2;
        const midY = ((sourceNode.y || 0) + (targetNode.y || 0)) / 2;
        return `translate(${midX}, ${midY})`;
      });
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, showFieldTypes, collapsedTables, selectedTableId, hoveredTableId, hoveredLinkId]);

  // Handle Zoom Actions
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.25);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.8);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || 1000;
    const height = containerRef.current.clientHeight || 700;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(width / 2 - 380, height / 2 - 250).scale(0.85));
  };

  // Export Map as SVG
  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saas-schema-map-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId);
  }, [tables, selectedTableId]);

  const selectedTableRelationships = useMemo(() => {
    if (!selectedTableId) return [];
    return links.filter(
      (l) => l.sourceTableId === selectedTableId || l.targetTableId === selectedTableId
    );
  }, [links, selectedTableId]);

  return (
    <div className="relative w-full h-[680px] bg-slate-950/5 rounded-3xl border border-slate-200/80 overflow-hidden flex flex-col font-sans" ref={containerRef} id="d3-schema-visual-map">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none" id="schema-map-top-bar">
        {/* Left Search & Filter Controls */}
        <div className="flex items-center gap-2 pointer-events-auto bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-200 shadow-sm" id="map-search-panel">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5" />
            <input
              type="text"
              placeholder="Search tables & fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-100/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 md:w-56"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFieldTypes(!showFieldTypes)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showFieldTypes ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Toggle data type badges"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Data Types</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLegend(!showLegend)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showLegend ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Legend</span>
          </button>
        </div>

        {/* Right Action & Zoom Toolbar */}
        <div className="flex items-center gap-2 pointer-events-auto bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm" id="map-zoom-toolbar">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-200 mx-0.5" />
          <button
            type="button"
            onClick={handleExportSvg}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Export Map as SVG"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Main D3 SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair select-none"
        id="d3-svg-root"
      />

      {/* Floating Bottom Left: Interactive Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-md text-xs space-y-2 max-w-xs animate-fade-in pointer-events-auto" id="schema-map-legend">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs font-display">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Relational Schema Legend
            </span>
            <button onClick={() => setShowLegend(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Primary Key (PK)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>Foreign Key (FK)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-600" />
              <span>Standard Relation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-pink-500" />
              <span>Cascade Delete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-sky-500" />
              <span>LOV Lookup Field</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-pink-100 border border-pink-300" />
              <span>Detail Table</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Right: Selected Table Details Card */}
      {selectedTable && (
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-indigo-200 shadow-xl max-w-sm w-full animate-fade-in pointer-events-auto" id="selected-table-inspector">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-slate-900 font-display text-sm">{selectedTable.label}</h4>
                {selectedTable.isDetailTable && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-700">Detail</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">table: {selectedTable.name}</p>
            </div>
            <button
              onClick={() => setSelectedTableId(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 mb-3">
            {selectedTable.description || "No description provided for this table entity."}
          </p>

          <div className="space-y-1.5 border-t border-slate-100 pt-2 mb-3 max-h-36 overflow-y-auto pr-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Connected Relationships ({selectedTableRelationships.length})</span>
            {selectedTableRelationships.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No connected foreign keys.</p>
            ) : (
              selectedTableRelationships.map((rel) => (
                <div key={rel.id} className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-1 text-slate-700">
                    <Link2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="font-semibold">{rel.sourceFieldName}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-500">{rel.targetFieldName}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    rel.onDelete === 'CASCADE' ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {rel.onDelete}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            {onEditTable && (
              <button
                type="button"
                onClick={() => onEditTable(selectedTable)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Table Schema
              </button>
            )}
            {onSelectTable && (
              <button
                type="button"
                onClick={() => onSelectTable(selectedTable.id)}
                className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Focus
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
