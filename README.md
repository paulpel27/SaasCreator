SaasCreator is a state of the art SAAS creator supported by AI.
You can create complete Saas applications only by text input.
it creates all, the database, the forms, reports and menus.
You can add dummy data in the database, just by telling ai in plain words.
You can extract all code from a created Saas app and install it wherever you want,
on Android, Linux, Windows, Apple pc and phone.
All data remail locally on your device.

How to install the SaasCreator app:
A Download the ZIP file with the code.
B Extract the ZIP file on a new local directory.

To run the app locally from your project folder:
Prerequisites
Node.js (v20 or newer recommended) and npm installed.
1. Install dependencies
Open a terminal in your project directory and run:
Bash
npm install
2. Configure environment variables (optional for AI features)
Copy .env.example to .env and add your Gemini API key:
Bash
cp .env.example .env
Then edit .env:
Env
GEMINI_API_KEY=your_api_key_here
(If you leave this unset, the app still runs normally and falls back to offline schema generation and chat responses.)
3. Run in development mode
Bash
npm run dev
This starts the Express server with Vite middleware. Open http://localhost:3000 in your browser.
Running a production build locally (optional)
Build the frontend and server bundle:
Bash
npm run build
Start the production server:
macOS / Linux:
Bash
NODE_ENV=production npm start
Windows (PowerShell):
Powershell
$env:NODE_ENV="production"; npm start
Open http://localhost:3000.

C Go to settings in the app and add the AI of your choice (many are free to use).
D Create your own apps, just by text input.
