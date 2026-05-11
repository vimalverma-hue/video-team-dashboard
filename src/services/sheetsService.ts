import Papa from 'papaparse';
import { VideoEntry } from '../types';

const SHEETS_CONFIG = {
  NATIONALS: {
    ID: '1Uw9-lgbdNXVzPRAYmapMJH2XXEd58rSIA78DTLjFcFU',
    GID: '101564942',
  },
  VERNAC: {
    ID: '1BjBaNxRAOWhNz1okh6fAibFESkBfnDkCd-EPIGxYeSI', 
    GID: '978833306', 
  },
  CREATIVE_BRP: {
    ID: '1sAqCpfAwahepv9-k1sfldpc_wvj7_RtNcUIe8fEaDwg',
    GID: '1816271126',
  },
  CREATIVE_SRA: {
    ID: '1AgunXii-2VA-xCyctUCMZVNIeQKgmS6Y5HgyT93jg3Q',
    GID: '1994272713',
  },
  CREATIVE_TUC: {
    ID: '1W792-4qEQaqVgSFy9q27tQNPtgGGXySGGB-Cd9W6g5s',
    GID: '1693166075',
  },
  CREATIVE_ENB: {
    ID: '11l9ZzO384rcgSEvHlzwfVNZcJmMNOHKI-XLOUcbZvHY',
    GID: '142686641',
  },
  CREATIVE_VERNAC: {
    ID: '1eyYKuoj-WP_YmBDFOGjHimWiXgOajwmYMyYUyhoWEsE',
    GID: '1703359617',
  }
};

export type SheetSource = 'NATIONALS' | 'VERNAC' | 'TESTPREP' | 'CREATIVE_BRP' | 'CREATIVE_SRA' | 'CREATIVE_TUC' | 'CREATIVE_ENB' | 'CREATIVE_VERNAC' | 'CREATIVE_TESTPREP';

// Simple in-memory cache
const DATA_CACHE: Record<string, { data: any[], timestamp: number }> = {};
const CACHE_TTL = 300 * 1000; // 5 minutes

/**
 * Fetches data from Google Sheets using the CSV export URL.
 * CSV export is generally faster and ignores spreadsheet-level UI filters/hidden rows.
 */
export async function fetchSheetData(source: SheetSource = 'NATIONALS'): Promise<any[]> {
  const now = Date.now();
  if (DATA_CACHE[source] && (now - DATA_CACHE[source].timestamp) < CACHE_TTL) {
    return DATA_CACHE[source].data;
  }

  if (source === 'TESTPREP') {
    const [nationals, vernac] = await Promise.all([
      fetchSheetData('NATIONALS'),
      fetchSheetData('VERNAC')
    ]);
    const merged = [...nationals, ...vernac].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    DATA_CACHE[source] = { data: merged, timestamp: Date.now() };
    return merged;
  }

  if (source === 'CREATIVE_TESTPREP') {
    const [brp, sra, tuc, enb, vernac] = await Promise.all([
      fetchSheetData('CREATIVE_BRP'),
      fetchSheetData('CREATIVE_SRA'),
      fetchSheetData('CREATIVE_TUC'),
      fetchSheetData('CREATIVE_ENB'),
      fetchSheetData('CREATIVE_VERNAC')
    ]);
    const merged = [...brp, ...sra, ...tuc, ...enb, ...vernac].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    DATA_CACHE[source] = { data: merged, timestamp: Date.now() };
    return merged;
  }

  try {
    const config = SHEETS_CONFIG[source];
    // Reverting to /export?format=csv which is the most reliable way to get ALL data (ignoring UI filters/hidden rows)
    const url = `https://docs.google.com/spreadsheets/d/${config.ID}/export?format=csv&gid=${config.GID}&tq_cb=${Date.now()}`;
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

      // Detect if it's a creative production sheet based on source name or column presence
      const isCreative = source.startsWith('CREATIVE_');

      if (isCreative) {
        let vertical = 'Others';
        if (source === 'CREATIVE_VERNAC') vertical = 'Vernac';
        else if (source.startsWith('CREATIVE_')) vertical = source.replace('CREATIVE_', '');

        return {
          timestamp: (timestamp || '').toString(),
          modeOfSession: (getVal(['Mode of Session'], 1) || '').toString(),
          creativeType: (getVal(['Creative Type'], 2) || '').toString(),
          mailSubjectLine: (getVal(['Mail Subject Line'], 3) || '').toString(),
          creativesCount: (getVal(['Creatives count'], 6) || '').toString(),
          designer: (getVal(['Designer'], 4) || '').toString(),
          status: (getVal(['Status'], 7) || 'Pending').toString().trim(),
          channel: (getVal(['Your Channel', 'Channel'], 2) || '').toString().trim(),
          vertical: vertical
        };
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
    const finalData = mappedData.filter(d => 
      d.timestamp && (d.email || d.channel || d.subject || d.designer || d.mailSubjectLine)
    );

    // Cache the result
    DATA_CACHE[source] = { data: finalData, timestamp: Date.now() };

    return finalData;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw new Error('Failed to connect to Google Sheets. Please ensure the sheet is public.');
  }
}

