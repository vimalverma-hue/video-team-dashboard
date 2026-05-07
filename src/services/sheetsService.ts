import Papa from 'papaparse';
import { VideoEntry } from '../types';

const SHEET_ID = '1Uw9-lgbdNXVzPRAYmapMJH2XXEd58rSIA78DTLjFcFU';
const GID = '101564942';

/**
 * Fetches data from Google Sheets using the CSV export URL.
 * CSV export is generally faster and ignores spreadsheet-level UI filters/hidden rows.
 */
export async function fetchSheetData(): Promise<VideoEntry[]> {
  try {
    // Using export format CSV ensures we get all data regardless of hidden rows or UI filters
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}&tq_cb=${Date.now()}`;
    const response = await fetch(url);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as any[];
          
          const mappedData = rows.map((row) => {
            // Find columns by name or index based on common headers
            const getVal = (names: string[], index: number) => {
              for (const name of names) {
                if (row[name] !== undefined) return row[name];
              }
              // Fallback to numeric index if headers don't match exactly
              const values = Object.values(row);
              return values[index] || '';
            };

            const timestampRaw = getVal(['Timestamp'], 0);
            let timestamp = timestampRaw;
            if (timestampRaw) {
              const date = new Date(timestampRaw);
              if (!isNaN(date.getTime())) {
                timestamp = date.toISOString();
              }
            }

            return {
              timestamp: (timestamp || '').toString(),
              email: (getVal(['Email Address', 'Email'], 1) || '').toString(),
              channel: (getVal(['Your Channel', 'Channel'], 2) || '').toString(),
              subject: (getVal(['Your Email Subject Line', 'Subject'], 3) || '').toString(),
              category: (getVal(['Video Category', 'Category'], 4) || '').toString().trim(),
              type: (getVal(['Video Type', 'Type'], 5) || '').toString().trim(),
              editors: (getVal(['Editors', 'Editor'], 6) || '').toString().trim(),
              status: (getVal(['Status'], 8) || 'Pending').toString().trim(),
            };
          });

          // Final filter to ensure we have at least some data in the row
          const cleanedData = mappedData.filter(d => 
            d.timestamp || d.email || d.channel || d.subject
          );

          resolve(cleanedData);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw new Error('Failed to connect to Google Sheets. Please ensure the sheet is public.');
  }
}

