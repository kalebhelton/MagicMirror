import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function GET() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const folderId = process.env.ACTUAL_DRIVE_FOLDER_ID;

  if (!clientEmail || !privateKey || !folderId) {
    return NextResponse.json({
      error: 'Actual Budget not configured',
      hint: 'Set GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and ACTUAL_DRIVE_FOLDER_ID in .env.local',
      transactions: []
    });
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Find the SQLite file in the shared folder
    const fileList = await drive.files.list({
      q: `'${folderId}' in parents and name contains '.sqlite' and trashed=false`,
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 5,
    });

    const files = fileList.data.files || [];
    if (files.length === 0) {
      return NextResponse.json({ error: 'No .sqlite file found in Drive folder', transactions: [] });
    }

    const file = files[0]; // most recently modified
    const fileId = file.id!;

    // Download the sqlite file to a temp location
    const tmpPath = path.join(os.tmpdir(), `actual-${fileId}.sqlite`);

    const dest = fs.createWriteStream(tmpPath);
    const driveResponse = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    await new Promise<void>((resolve, reject) => {
      (driveResponse.data as NodeJS.ReadableStream)
        .pipe(dest)
        .on('finish', resolve)
        .on('error', reject);
    });

    // Read with sql.js (pure JS SQLite - no native deps)
    const initSqlJs = (await import('sql.js')).default;
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(tmpPath);
    const db = new SQL.Database(fileBuffer);

    // Query recent transactions with payee names
    // Actual Budget stores amounts in cents (integer), negative = expense
    const result = db.exec(`
      SELECT 
        t.id,
        t.date,
        COALESCE(p.name, t.description, 'Unknown') as payee,
        t.amount,
        t.notes
      FROM transactions t
      LEFT JOIN payees p ON p.id = t.payee_mapping
      WHERE t.tombstone = 0
        AND t.is_parent = 0
      ORDER BY t.date DESC
      LIMIT 20
    `);

    db.close();
    fs.unlinkSync(tmpPath);

    if (!result.length || !result[0].values.length) {
      return NextResponse.json({ transactions: [], note: 'No transactions found' });
    }

    const cols = result[0].columns;
    const rows = result[0].values;

    const transactions = rows.map(row => {
      const obj: Record<string, unknown> = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return {
        id: obj.id as string,
        date: formatActualDate(obj.date as number),
        payee: obj.payee as string,
        // Actual stores as integer millidollars (e.g. -1234 = -$12.34) or cents depending on version
        amount: (obj.amount as number) / 100,
        notes: obj.notes as string | null,
      };
    });

    return NextResponse.json({ transactions, source: file.name, lastModified: file.modifiedTime });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, transactions: [] });
  }
}

// Actual Budget stores dates as integers like 20240615
function formatActualDate(dateInt: number): string {
  const s = String(dateInt);
  if (s.length === 8) {
    return `${s.slice(4, 6)}/${s.slice(6, 8)}`;
  }
  return s;
}
