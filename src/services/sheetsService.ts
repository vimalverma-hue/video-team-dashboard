import { VideoEntry } from '../types';

const SHEET_ID = '1Uw9-lgbdNXVzPRAYmapMJH2XXEd58rSIA78DTLjFcFU';
const GID = '101564942';

/**
 * Fetches data from Google Sheets using the Visualization API.
 */
export async function fetchSheetData(): Promise<VideoEntry[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;
    const response = await fetch(url);
    const text = await response.text();
    
    // The library returns a string wrapped in a function call "google.visualization.Query.setResponse(...)"
    // We need to extract the JSON part.
    const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(jsonStr);
    
    const rows = data.table.rows;
    // Map column indices to our interface:
    // 0: Timestamp
    // 1: Email Address
    // 2: Your Channel
    // 3: Your Email Subject Line
    // 4: Video Category  
    // 5: Video Type
    // 6: Editors
    // 7: Status
    
    return rows.map((row: any) => ({
      timestamp: row.c[0]?.f || row.c[0]?.v || '',
      email: row.c[1]?.f || row.c[1]?.v || '',
      channel: row.c[2]?.f || row.c[2]?.v || '',
      subject: row.c[3]?.f || row.c[3]?.v || '',
      category: row.c[4]?.f || row.c[4]?.v || '',
      type: row.c[5]?.f || row.c[5]?.v || '',
      editors: row.c[6]?.f || row.c[6]?.v || '',
      status: row.c[7]?.f || row.c[7]?.v || 'Pending',
    }));
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw new Error('Failed to connect to Google Sheets. Please ensure the sheet is public.');
  }
}
