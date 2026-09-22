const XLSX = require('xlsx');

/**
 * Extract Google Drive links & response counts from CSV or Excel (.xlsx/.xls) files.
 * - Supports .xlsx, .xls, .csv, .tsv formats.
 * - Auto-detects Google Drive URLs, direct PDF URLs, or any HTTP/HTTPS links.
 * - Extracts response count if available in adjacent columns or headers.
 */
function parseCSV(buffer) {
  const results = [];
  const seenUrls = new Set();

  let rows = [];

  // Try parsing as Excel first (.xlsx / .xls)
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
      if (Array.isArray(sheetData) && sheetData.length > 0) {
        rows.push(...sheetData);
      }
    }
  } catch (err) {
    // If Excel parse fails, fallback to plain text CSV parsing
  }

  // Fallback if XLSX didn't produce rows: parse as plain text CSV
  if (rows.length === 0) {
    const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const splitRow = (row) => row.split(/,(?=(?:(?:[^"]*"){2})*[^" ]*$)|[;\t]/)
      .map(c => c.trim().replace(/^["']|["']$/g, ''));
    rows = lines.map(splitRow);
  }

  if (rows.length === 0) return [];

  // Identify column indices if headers exist
  let linkColIdx = -1;
  let respColIdx = -1;

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const cells = row.map(c => String(c || '').toLowerCase().trim());
    
    const isHeaderCandidate = cells.some(c => c.includes('faculty') || c.includes('name') || c.includes('link') || c.includes('drive') || c.includes('url') || c.includes('pdf'));
    if (isHeaderCandidate) {
      const lIdx = cells.findIndex(c => c.includes('link') || c.includes('drive') || c.includes('url') || c.includes('pdf'));
      const rIdx = cells.findIndex(c => c.includes('resp') || c.includes('count') || c.includes('student'));
      if (lIdx !== -1) linkColIdx = lIdx;
      if (rIdx !== -1) respColIdx = rIdx;
      break;
    }
  }

  // Iterate over all rows to extract URLs & response counts
  for (const row of rows) {
    if (!Array.isArray(row) || row.length === 0) continue;
    const rowStr = row.map(c => String(c || '')).join(' ');

    // Extract URL
    let foundUrl = '';

    // 1. Check designated link column if known
    if (linkColIdx !== -1 && row[linkColIdx]) {
      const cellVal = String(row[linkColIdx]).trim();
      const match = cellVal.match(/https?:\/\/[^\s"',;]+/i);
      if (match) foundUrl = match[0];
    }

    // 2. Scan entire row for Google Drive or HTTP/HTTPS URLs
    if (!foundUrl) {
      const driveMatch = rowStr.match(/https?:\/\/(?:drive\.google\.com|docs\.google\.com)[^\s"',;]+/i);
      if (driveMatch) {
        foundUrl = driveMatch[0];
      } else {
        const generalMatch = rowStr.match(/https?:\/\/[^\s"',;]+/i);
        if (generalMatch) foundUrl = generalMatch[0];
      }
    }

    if (!foundUrl) continue;

    // Clean up trailing punctuation from URL
    foundUrl = foundUrl.replace(/[.,;)]+$/, '');

    // Skip duplicates
    if (seenUrls.has(foundUrl)) continue;
    seenUrls.add(foundUrl);

    // Extract Response Count
    let respCount = null;
    if (respColIdx !== -1 && row[respColIdx]) {
      const val = parseInt(String(row[respColIdx]).replace(/[^\d]/g, ''), 10);
      if (!isNaN(val) && val > 0) respCount = val;
    }

    // Fallback response count check in adjacent cells
    if (respCount === null) {
      for (const cell of row) {
        const cellStr = String(cell || '').trim();
        if (/^\d{1,4}$/.test(cellStr)) {
          const val = parseInt(cellStr, 10);
          if (val > 0 && val < 5000) {
            respCount = val;
            break;
          }
        }
      }
    }

    results.push({ pdfLink: foundUrl, responseCount: respCount });
  }

  console.log(`[CSV Parser] Parsed ${results.length} valid links from input file.`);
  return results;
}

module.exports = { parseCSV };
