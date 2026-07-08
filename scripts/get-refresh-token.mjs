// Run once locally: npm run get-google-token
// Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET already set in .env.local
// (create an OAuth client of type "Web application" in Google Cloud Console
// and add http://localhost:3005/oauth2callback as an authorized redirect URI)

import dotenv from 'dotenv';
import http from 'node:http';
import { google } from 'googleapis';

dotenv.config({ path: '.env.local' });

const PORT = 3005;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local first.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // forces a refresh_token to be issued every time
  scope: ['https://www.googleapis.com/auth/calendar.readonly'],
});

console.log('\nOpen this URL in your browser and approve access:\n');
console.log(authUrl, '\n');

const server = http
  .createServer(async (req, res) => {
    if (!req.url.startsWith('/oauth2callback')) return;

    const url = new URL(req.url, REDIRECT_URI);
    const code = url.searchParams.get('code');

    res.end('Success! You can close this tab and return to the terminal.');
    server.close();

    const { tokens } = await oauth2Client.getToken(code);

    console.log('\nAdd this to your .env.local:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);

    if (!tokens.refresh_token) {
      console.log(
        'No refresh_token returned — this usually means you already authorized this app before.\n' +
        'Go to https://myaccount.google.com/permissions, remove access for this app, and run this script again.'
      );
    }

    process.exit(0);
  })
  .listen(PORT, () => {
    console.log(`Waiting for you to approve access... (listening on port ${PORT})`);
  });
