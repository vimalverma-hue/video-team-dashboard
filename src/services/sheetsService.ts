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
    // Reverting to /export?format=csv which is the most reliable way to get ALL data (ignoring UI filters/hidden rows)
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}&tq_cb=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) throw new Error('Sheet not found. Please check your SHEET_ID and GID.');
      if (response.status === 403 || response.status === 401) throw new Error('Access denied. Please ensure the Google Sheet is public (Anyone with the link can view).');
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    
    // Using any cast to bypass problematic type overloads that cause "unique symbol" errors
    const results = (Papa.parse as any)(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      trimHeaders: true,
    });

    const rows = results.data as any[];
    
    const mappedData = rows.map((row) => {
      // Find columns by name or index based on common headers
      const getVal = (names: string[], index: number) => {
        // Try variations of names (trimmed, lowercase)
        const keys = Object.keys(row);
        for (const name of names) {
          const foundKey = keys.find(k => k.toLowerCase().trim() === name.toLowerCase().trim());
          if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) return row[foundKey];
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

      // Robust Status Detection using prioritized columns
      let status = (getVal(['Status'], 8) || 'Pending').toString().trim();
      
      const rawCategory = (getVal(['Video Category', 'Category'], 4) || '').toString().trim();
      let category = rawCategory;
      // Normalize various shorts categories into one
      if (rawCategory.toLowerCase().includes('shorts')) {
        category = 'Shorts';
      }

      return {
        timestamp: (timestamp || '').toString(),
        email: (getVal(['Email Address', 'Email'], 1) || '').toString(),
        channel: (getVal(['Your Channel', 'Channel'], 2) || '').toString(),
        subject: (getVal(['Your Email Subject Line', 'Subject'], 3) || '').toString(),
        category,
        type: (getVal(['Video Type', 'Type'], 5) || '').toString().trim(),
        editors: (getVal(['Editors', 'Editor'], 6) || '').toString().trim(),
        status: status || 'Pending',
      };
    });

    // Final filter to ensure we have at least some data in the row
    return mappedData.filter(d => 
      d.timestamp || d.email || d.channel || d.subject
    );
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw new Error('Failed to connect to Google Sheets. Please ensure the sheet is public.');
  }
}

