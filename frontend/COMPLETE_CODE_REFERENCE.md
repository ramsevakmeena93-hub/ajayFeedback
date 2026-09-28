# Complete Code Reference - All Files

## ≡ƒôü FILE STRUCTURE

```
backend/
Γö£ΓöÇΓöÇ models/
Γöé   Γö£ΓöÇΓöÇ FacultyReport.js          # Main report model
Γöé   Γö£ΓöÇΓöÇ Submission.js              # HOD ΓåÆ VC submission model
Γöé   Γö£ΓöÇΓöÇ User.js                    # User accounts & profiles
Γöé   Γö£ΓöÇΓöÇ TeachingAssignment.js      # Faculty course assignments
Γöé   Γö£ΓöÇΓöÇ Notification.js            # In-app notifications
Γöé   Γö£ΓöÇΓöÇ ApprovalPolicy.js          # Conflict resolution policies
Γöé   Γö£ΓöÇΓöÇ ActivityLog.js             # Activity audit trail
Γöé   Γö£ΓöÇΓöÇ AuditLog.js               # System audit logs
Γöé   Γö£ΓöÇΓöÇ SystemLog.js              # System logs
Γöé   ΓööΓöÇΓöÇ UserRole.js               # Multi-role support
Γö£ΓöÇΓöÇ routes/
Γöé   Γö£ΓöÇΓöÇ process.js                # CSV upload & PDF processing
Γöé   Γö£ΓöÇΓöÇ reports.js                # Report CRUD & management
Γöé   Γö£ΓöÇΓöÇ submissions.js            # HOD ΓåÆ VC workflow
Γöé   Γö£ΓöÇΓöÇ middleware.js             # Auth & authorization
Γöé   Γö£ΓöÇΓöÇ workspace.js              # Workspace switching
Γöé   Γö£ΓöÇΓöÇ notifications.js          # Notification endpoints
Γöé   ΓööΓöÇΓöÇ admin.js                  # Admin panel
Γö£ΓöÇΓöÇ services/
Γöé   Γö£ΓöÇΓöÇ csvParser.js              # Excel/CSV parser
Γöé   Γö£ΓöÇΓöÇ pdfGenerator.js           # PDF report generator
Γöé   Γö£ΓöÇΓöÇ pdfAnalyzer.js            # PDF text extraction
Γöé   Γö£ΓöÇΓöÇ aiAnalyzer.js             # Google Gemini AI
Γöé   Γö£ΓöÇΓöÇ cloudStorage.js           # File upload/storage
Γöé   Γö£ΓöÇΓöÇ cache.js                  # In-memory cache
Γöé   Γö£ΓöÇΓöÇ emailService.js           # Email notifications
Γöé   ΓööΓöÇΓöÇ logger.js                 # Logging service
ΓööΓöÇΓöÇ server.js                     # Express app entry point
```

---

## ≡ƒôä COMPLETE CODE FILES

### 1. backend/models/FacultyReport.js

```javascript
const mongoose = require('mongoose');

const facultyReportSchema = new mongoose.Schema({
  hodId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  facultyUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // linked faculty account

  // Core fields (editable by HOD)
  facultyName: { type: String, default: '' },
  subjectCode: { type: String, default: '' },
  programme: { type: String, default: '' },
  semester: { type: String, default: '' },
  pdfLink: { type: String, default: '' },
  driveLink: { type: String, default: '' },
  pdfFilePath: { type: String, default: '' }, // absolute path to original uploaded file on server

  // ΓöÇΓöÇ Extended location fields (separate from roles) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  /** Branch ΓÇö e.g. "CSE", "IT", "EC". Complements programme (which holds the full degree name). */
  branch:   { type: String, default: '' },

  /** Section ΓÇö e.g. "A", "B", "C" */
  section:  { type: String, default: '' },

  /**
   * Reference to a TeachingAssignment document.
   * Linked when a report is sent to faculty and the backend can match
   * the subjectCode+branch+section to a known assignment.
   * Optional ΓÇö reports can exist without a formal assignment.
   */
  teachingAssignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeachingAssignment',
    default: null,
  },

  // AI + color-based analysis
  appreciation: [{ type: String }],
  commentsNeedingAttention: [{ type: String }],
  appreciationCount: { type: Number, default: 0 },
  attentionCount: { type: Number, default: 0 },
  ffiScore: { type: Number, default: null },
  responseCount: { type: Number, default: null }, // Number of students who gave feedback
  responsePercent: { type: Number, default: null }, // Percentage of student responses (e.g. 69.57)
  registeredStudents: { type: Number, default: null },
  linkSent: { type: Number, default: null },
  commentPercentages: { type: Object, default: {} }, // { "Excellent": 10, "Very Good": 25, "Good": 65 }
  rawStudentComments: [{ type: String }],  // Original unmodified student comments
  commentCategories: { type: Object, default: {} }, // { Speed: [...], Clarity: [...], etc. }

  // HOD editable fields
  hodRemarks: { type: String, default: '' },
  actionTaken: { type: String, default: '' },  // HOD action taken comment
  goodComments: [{ type: String }],
  badComments: [{ type: String }],

  // Faculty acknowledgment
  facultyAcknowledged: { type: Boolean, default: false },
  facultyAcknowledgedAt: { type: Date },
  sentToFacultyAt: { type: Date },

  status: { type: String, enum: ['pending', 'processed', 'error', 'sent_to_faculty', 'faculty_approved'], default: 'pending' },
  errorMessage: { type: String },
  analyzedAt: { type: Date },
  academicYear: { type: String, default: () => new Date().getFullYear().toString() } // e.g. "2025"
}, { timestamps: true });

module.exports = mongoose.model('FacultyReport', facultyReportSchema);
```

---

### 2. backend/models/Submission.js

```javascript
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  hodId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FacultyReport' }],

  /**
   * Approval status ΓÇö extended state machine:
   *
   *  submitted   ΓåÆ initial state when HOD sends to VC
   *  pending     ΓåÆ synonym for submitted (alias kept for clarity in multi-HOD flow)
   *  approved    ΓåÆ VC/approver accepted
   *  rejected    ΓåÆ VC/approver rejected (terminal for this version)
   *  reviewed    ΓåÆ legacy alias for approved
   *  sent_back   ΓåÆ returned to HOD with comments for revision
   *  conflict    ΓåÆ self-approval conflict detected, awaiting resolution
   *  escalated   ΓåÆ conflict could not be auto-resolved; admin intervention needed
   */
  status: {
    type: String,
    enum: ['submitted', 'pending', 'approved', 'rejected', 'reviewed', 'sent_back', 'conflict', 'escalated'],
    default: 'submitted',
  },

  vcComment: { type: String, default: '' },
  department: { type: String, default: '' },
  academicYear: { type: String, default: '' },
  semester: { type: String, default: '' },
  session: { type: String, default: '' },           // "jul-dec" | "jan-may"
  feedbackFormNo: { type: String, default: 'I' },   // "I" | "II"
  submissionDate: { type: Date, default: null },     // date HOD submitted CSV
  finalReportDate: { type: Date, default: null },    // date VC / approver approved
  submittedAt: { type: Date, default: Date.now },

  // ΓöÇΓöÇ Multi-role approval fields ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

  /**
   * The user who will actually approve this submission.
   * Normally the VC, but can be an alternate HOD if the primary HOD has a
   * self-conflict (i.e., the HOD is also the evaluated faculty).
   */
  approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  /**
   * The alternate approver selected when a self-conflict was detected.
   * Populated by the backend conflict-resolution logic; never set by the client.
   */
  alternateApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  /**
   * Human-readable description of why a conflict was detected.
   * e.g. "Submitting HOD is also the evaluated faculty for report <id>"
   */
  conflictReason: { type: String, default: '' },

  /**
   * When the conflict was first detected (for SLA tracking).
   */
  conflictDetectedAt: { type: Date, default: null },

  /**
   * When an escalation was raised (status = 'escalated').
   */
  escalatedAt: { type: Date, default: null },

  /**
   * Workspace context the submitting HOD was in when they created this.
   * Recorded for audit purposes.
   */
  submittedFromWorkspace: { type: String, default: 'hod' },

}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
```

---

### 3. backend/models/User.js

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Core identity
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },

  /**
   * Legacy single-role field ΓÇö kept for backward compatibility.
   * New code should read roles from the UserRole collection.
   * This field is still used as the "primary" / "last-active" role
   * so existing queries don't break.
   */
  role:         { type: String, enum: ['hod', 'vc', 'faculty', 'admin'], default: 'hod' },
  department:   { type: String, default: '' },

  /**
   * Multi-role support:
   * Cached list of role names this user holds (populated from UserRole collection).
   * Backend always re-checks UserRole for authorization; this is a convenience cache.
   */
  roles: [{
    type: String,
    enum: ['hod', 'vc', 'faculty', 'admin'],
  }],

  /**
   * Active workspace ΓÇö the role context the user is currently operating in.
   * Stored server-side so it survives page refreshes.
   * Values: 'hod' | 'faculty' | 'vc' | 'admin'
   */
  activeWorkspace: { type: String, enum: ['hod', 'vc', 'faculty', 'admin', ''], default: '' },

  /**
   * Alternate approver ΓÇö when this user (as HOD) has a self-conflict,
   * route approvals to this user instead.
   * Overridden per-faculty by ApprovalPolicy.alternateApprovers.
   */
  defaultAlternateApproverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Extended profile
  employeeId:   { type: String, default: '' },
  phone:        { type: String, default: '' },
  gender:       { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  designation:  { type: String, default: '' },
  experience:   { type: String, default: '' },       // e.g. "5 years"
  qualification:{ type: String, default: '' },       // e.g. "PhD, M.Tech"
  bio:          { type: String, default: '' },
  cabin:        { type: String, default: '' },

  // Account status & session tracking
  status:       { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  lastLogin:    { type: Date },
  loginCount:   { type: Number, default: 0 },
  sessionTimeMinutes: { type: Number, default: 0 },

  // Online presence tracking
  isOnline:     { type: Boolean, default: false },
  lastSeen:     { type: Date, default: null },   // last time they were active / disconnected
  currentLoginAt: { type: Date, default: null }, // when current session started
  lastLeaveAt:    { type: Date, default: null }, // when they last went offline

  // Profile completion flag (used to prompt dept on first Google login)
  profileComplete: { type: Boolean, default: false },
  needsDeptSetup:  { type: Boolean, default: false }, // true for Google-auth users who skipped dept

  // Media
  profilePhoto:         { type: String, default: '' },  // base64 or URL
  signatureImage:       { type: String, default: '' },  // base64 PNG
  signatureUploadedAt:  { type: Date },
  signatureStatus:      { type: String, enum: ['pending', 'verified', 'rejected', ''], default: '' },

  // Google OAuth
  googleId:      { type: String, default: '' },
  googleVerified:{ type: Boolean, default: false },
}, { timestamps: true });

// Virtual: short employee ID derived from _id
userSchema.virtual('empId').get(function() {
  return this.employeeId || ('EMP' + this._id.toString().slice(-4).toUpperCase());
});

module.exports = mongoose.model('User', userSchema);
```

---

### 4. backend/services/csvParser.js

```javascript
const XLSX = require('xlsx');
const AdmZip = require('adm-zip');

/**
 * Extract hyperlink URLs directly from xlsx ZIP XML relationships.
 * This works regardless of xlsx library version or environment.
 * Returns: { cellRef -> url } e.g. { 'A1': 'https://...', 'A2': 'https://...' }
 */
function extractHyperlinksFromXlsx(buffer) {
  const urlMap = {}; // cellRef -> url
  try {
    const zip = new AdmZip(buffer);

    // Find sheet1 XML and its relationships file
    const sheetXmlEntry = zip.getEntries().find(e => e.entryName.match(/xl\/worksheets\/sheet1\.xml$/i));
    const relsEntry = zip.getEntries().find(e => e.entryName.match(/xl\/worksheets\/_rels\/sheet1\.xml\.rels$/i));

    if (!relsEntry) return urlMap;

    // Parse relationships: Id -> URL
    const relsXml = zip.readAsText(relsEntry);
    const relMap = {};
    const relRegex = /Id="([^"]+)"[^>]+Type="[^"]*hyperlink[^"]*"[^>]+Target="([^"]+)"/gi;
    let m;
    while ((m = relRegex.exec(relsXml)) !== null) {
      relMap[m[1]] = m[2].replace(/&amp;/g, '&');
    }

    if (!sheetXmlEntry) return urlMap;

    // Parse sheet XML: find <hyperlink ref="A1" r:id="rId1"/>
    const sheetXml = zip.readAsText(sheetXmlEntry);
    const hlRegex = /<hyperlink[^>]+ref="([^"]+)"[^>]+r:id="([^"]+)"[^>]*\/?>/gi;
    while ((m = hlRegex.exec(sheetXml)) !== null) {
      const cellRef = m[1]; // e.g. "A1"
      const rId = m[2];     // e.g. "rId1"
      if (relMap[rId]) urlMap[cellRef] = relMap[rId];
    }
  } catch (e) {
    console.warn('[Parser] hyperlink XML extraction error:', e.message);
  }
  return urlMap;
}

/**
 * Extract Google Drive / PDF links & associated metadata from Excel (.xlsx/.xls) or CSV files.
 * - Inspects raw cell values, formatted strings, Excel hyperlinks (cell.l.Target), and formulas (=HYPERLINK).
 * - Multi-column detector extracts Faculty Name, Subject Code, Course Name, Programme, Semester, Response Count, and FFI Score.
 * - Deduplicates URLs and sanitizes whitespace/punctuation.
 */
function parseCSV(buffer) {
  const results = [];
  const seenUrls = new Set();

  // Extract hyperlinks directly from xlsx XML (reliable on all environments)
  const hyperlinkMap = extractHyperlinksFromXlsx(buffer);
  console.log('[Parser] Hyperlinks from XML:', hyperlinkMap);

  let sheetsData = [];

  // 1. Try reading with XLSX (supports .xlsx, .xls, .ods)
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellFormula: true, cellStyles: true, cellHTML: false, bookVBA: false });
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet || !sheet['!ref']) continue;

      const range = XLSX.utils.decode_range(sheet['!ref']);
      const sheetRows = [];

      for (let R = range.s.r; R <= range.e.r; ++R) {
        const rowCells = [];
        let rowHasContent = false;

        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = sheet[cellAddr];
          if (!cell) {
            rowCells.push({ val: '', link: '', formula: '' });
            continue;
          }

          rowHasContent = true;
          const val = cell.w !== undefined ? String(cell.w).trim() : cell.v !== undefined ? String(cell.v).trim() : '';
          // Use XML hyperlink map first (most reliable), fall back to cell.l
          let link = hyperlinkMap[cellAddr] || ((cell.l && cell.l.Target) ? String(cell.l.Target).trim().replace(/&amp;/g, '&') : '');
          const formula = cell.f ? String(cell.f).trim() : '';

          // If formula is =HYPERLINK("url", ...), extract url
          if (!link && formula) {
            const m = formula.match(/HYPERLINK\s*\(\s*["']([^"']+)["']/i);
            if (m) link = m[1].trim().replace(/&amp;/g, '&');
          }

          // If val itself looks like a URL, use it as link too
          if (!link && val.startsWith('http')) {
            link = val.replace(/&amp;/g, '&');
          }

          rowCells.push({ val, link, formula });
        }

        if (rowHasContent) {
          sheetRows.push(rowCells);
        }
      }

      if (sheetRows.length > 0) {
        sheetsData.push(sheetRows);
      }
    }
  } catch (err) {
    console.warn('[Parser] XLSX parse notice:', err.message);
  }

  // 2. Fallback to plain text CSV if XLSX didn't produce rows
  if (sheetsData.length === 0) {
    const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const splitRow = (row) => row.split(/,(?=(?:(?:[^"]*"){2})*[^" ]*$)|[;\t]/)
      .map(c => c.trim().replace(/^["']|["']$/g, ''));
    const rows = lines.map(line => splitRow(line).map(c => ({ val: c, link: '', formula: '' })));
    if (rows.length > 0) sheetsData.push(rows);
  }

  if (sheetsData.length === 0) return [];

  // 3. Process extracted sheets
  for (const rows of sheetsData) {
    let headerIdx = -1;
    const colMap = {
      faculty: -1,
      subjectCode: -1,
      courseName: -1,
      link: -1,
      resp: -1,
      programme: -1,
      semester: -1,
      ffi: -1
    };

    // Scan first 15 rows for header row
    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const row = rows[r];
      const texts = row.map(c => c.val.toLowerCase());
      const rowStr = texts.join(' ');

      // Skip rows that actually contain URLs ΓÇö those are data rows
      const hasUrl = row.some(c => /https?:\/\//i.test(c.val) || (c.link && c.link.startsWith('http')));
      if (hasUrl) continue;

      const isHeader = texts.some(t =>
        t.includes('faculty') || t.includes('teacher') || t.includes('instructor') ||
        t.includes('link') || t.includes('url') ||
        t.includes('course') || t.includes('subject') || t.includes('name')
      );

      if (isHeader) {
        headerIdx = r;
        texts.forEach((txt, idx) => {
          if (colMap.link === -1 && (txt.includes('link') || txt.includes('drive') || txt.includes('url') || txt.includes('pdf'))) {
            colMap.link = idx;
          } else if (colMap.faculty === -1 && (txt.includes('faculty') || txt.includes('teacher') || txt.includes('instructor') || (txt.includes('name') && !txt.includes('course') && !txt.includes('subject')))) {
            colMap.faculty = idx;
          } else if (colMap.subjectCode === -1 && (txt.includes('code') || txt.includes('course id') || txt.includes('sub code') || txt.includes('paper code'))) {
            colMap.subjectCode = idx;
          } else if (colMap.courseName === -1 && (txt.includes('course name') || txt.includes('subject name') || txt.includes('paper name') || (txt.includes('subject') && !txt.includes('code')))) {
            colMap.courseName = idx;
          } else if (colMap.resp === -1 && (txt.includes('resp') || txt.includes('student') || txt.includes('count') || txt.includes('feedback count'))) {
            colMap.resp = idx;
          } else if (colMap.programme === -1 && (txt.includes('program') || txt.includes('degree') || txt.includes('branch') || txt.includes('dept'))) {
            colMap.programme = idx;
          } else if (colMap.semester === -1 && (txt.includes('sem') || txt.includes('term'))) {
            colMap.semester = idx;
          } else if (colMap.ffi === -1 && (txt.includes('ffi') || txt.includes('score') || txt.includes('rating') || txt.includes('index'))) {
            colMap.ffi = idx;
          }
        });
        break;
      }
    }

    const startRow = headerIdx !== -1 ? headerIdx + 1 : 0;

    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r];

      // Collect ALL urls from this row ΓÇö a cell may contain multiple concatenated URLs
      const allUrlsInRow = [];

      // First check cell hyperlink targets
      for (const c of row) {
        if (c.link && c.link.startsWith('http')) {
          allUrlsInRow.push(c.link.trim());
        }
      }

      // Then scan all cell text values ΓÇö extract every https?:// occurrence
      const fullRowStr = row.map(c => c.val).join(' ');
      const urlRegex = /https?:\/\/[^\s"',;<>\]]+/gi;
      let m;
      while ((m = urlRegex.exec(fullRowStr)) !== null) {
        const url = m[0].replace(/[.,;)&]+$/, ''); // strip trailing junk
        if (!allUrlsInRow.includes(url)) allUrlsInRow.push(url);
      }

      if (allUrlsInRow.length === 0) continue;

      // Extract facultyName from first non-URL text cell (usually col A = filename)
      let facultyName = '';
      for (const c of row) {
        const v = c.val.trim();
        if (v && !v.startsWith('http') && v.length > 2) {
          // Strip .pdf extension to get a clean name
          facultyName = v.replace(/\.pdf$/i, '').trim();
          break;
        }
      }

      let subjectCode = '';
      if (colMap.subjectCode !== -1 && row[colMap.subjectCode]) subjectCode = row[colMap.subjectCode].val.trim();

      let courseName = '';
      if (colMap.courseName !== -1 && row[colMap.courseName]) courseName = row[colMap.courseName].val.trim();

      let programme = '';
      if (colMap.programme !== -1 && row[colMap.programme]) programme = row[colMap.programme].val.trim();

      let semester = '';
      if (colMap.semester !== -1 && row[colMap.semester]) semester = row[colMap.semester].val.trim();

      let responseCount = null;
      if (colMap.resp !== -1 && row[colMap.resp]) {
        const v = parseInt(row[colMap.resp].val.replace(/[^\d]/g, ''), 10);
        if (!isNaN(v) && v > 0) responseCount = v;
      }

      let ffiScore = null;
      if (colMap.ffi !== -1 && row[colMap.ffi]) {
        const v = parseFloat(row[colMap.ffi].val.replace(/[^\d.]/g, ''));
        if (!isNaN(v) && v >= 0 && v <= 5) ffiScore = v;
      }

      // Emit one result per URL found in this row
      for (const url of allUrlsInRow) {
        const cleanUrl = url.replace(/&amp;/g, '&').replace(/[.,;)]+$/, '');
        if (!cleanUrl.startsWith('http')) continue;
        if (seenUrls.has(cleanUrl)) continue;
        seenUrls.add(cleanUrl);

        results.push({
          pdfLink: cleanUrl,
          facultyName,
          subjectCode,
          courseName,
          programme,
          semester,
          responseCount,
          ffiScore
        });
      }
    }
  }

  console.log(`[Spreadsheet Parser] Successfully parsed ${results.length} valid links.`);
  return results;
}

module.exports = { parseCSV };
```

---

### 5. backend/routes/process.js

**(See earlier in this conversation for complete code - it's in your context)**

Key endpoints:
- `POST /api/process/upload-csv` - Upload Excel/CSV with PDF links
- `POST /api/process/process-one` - Process single PDF with AI
- `POST /api/process/status` - Poll processing status
- `POST /api/process/scan-pdfs` - Extract metadata only
- `POST /api/process/upload-pdfs` - Direct PDF upload
- `POST /api/process/upload-batch` - Batch upload (ZIP)

---

### 6. backend/routes/middleware.js

**(Complete code provided earlier in conversation)**

Key functions:
- `authMiddleware` - JWT verification
- `requireRole(...roles)` - Single role check
- `requireAnyRole(...roles)` - Multi-role check
- `requireWorkspace(workspace)` - Workspace enforcement
- `checkSelfApprovalConflict(submission, hodUserId)` - Self-approval detection
- `resolveAlternateApprover(submission, facultyIds, hodId)` - Alternate approver resolution

---

### 7. backend/routes/submissions.js

**(Complete code provided earlier in conversation)**

Key endpoints:
- `POST /api/submissions/send` - HOD sends reports to VC (with conflict detection)
- `GET /api/submissions/my` - HOD's submissions
- `GET /api/submissions/faculty` - Faculty's approved reports
- `GET /api/submissions/all` - All submissions (VC/Admin)
- `PATCH /api/submissions/:id/status` - VC approve/reject
- `GET /api/submissions/:id/download-pdf` - Download final PDF

---

### 8. backend/services/pdfGenerator.js

**(First 762 lines and remaining lines provided earlier)**

Key functions:
- `generateFeedbackReportPDF(options)` - Main PDF generator
- `generateIndividualFacultyPDF(report)` - Individual faculty report

Features:
- A4 Landscape format (842x595pt)
- 11-column table with dynamic row heights
- Auto-pagination
- Color-coded FFI scores
- Signature embedding (HOD, VC, Faculty)
- Appends individual PDFs from Google Drive
- Stamps signatures on appended PDFs
- Professional layout with institution branding

---

### 9. Additional API Endpoints Summary

#### backend/routes/reports.js

**HOD Endpoints:**
- `GET /api/reports/my` - Get HOD's reports
- `GET /api/reports/:id` - Get single report
- `PATCH /api/reports/:id/edit` - Edit report
- `PATCH /api/reports/:id/remarks` - Update HOD remarks
- `POST /api/reports/:id/send-to-faculty` - Send to faculty
- `POST /api/reports/bulk-send-to-faculty` - Bulk send
- `DELETE /api/reports/:id` - Delete report
- `DELETE /api/reports/my/all` - Delete all unapproved
- `GET /api/reports/my/export` - Export as CSV
- `GET /api/reports/my/preview-pdf` - Preview PDF
- `POST /api/reports/my/export-pdf` - Export PDF
- `POST /api/reports/:id/ai-analyze` - Re-analyze with AI
- `POST /api/reports/my/fix-metadata` - Fix metadata from PDFs
- `GET /api/reports/ai/test` - Test AI connection

**Faculty Endpoints:**
- `GET /api/reports/faculty/my` - Faculty's reports
- `GET /api/reports/faculty/analysis` - Analysis summary
- `GET /api/reports/faculty/advanced-analytics` - Advanced analytics
- `POST /api/reports/:id/acknowledge` - Acknowledge report

**VC/Admin Endpoints:**
- `GET /api/reports/submission/:submissionId` - Get submission reports

**PDF Serving:**
- `GET /api/reports/:id/pdf` - Serve original uploaded PDF
- `GET /api/reports/:id/summary-pdf` - AI-generated summary PDF

---

## ≡ƒöº SERVICE LAYER FUNCTIONS

### csvParser.js
```javascript
parseCSV(buffer) // Returns: Array of { pdfLink, facultyName, subjectCode, ... }
extractHyperlinksFromXlsx(buffer) // Returns: { cellRef -> url }
```

### pdfGenerator.js
```javascript
generateFeedbackReportPDF({ submission, reports, hodUser, vcUser, approvedAt, isPreview, withoutSignatures })
// Returns: Buffer (PDF file)

generateIndividualFacultyPDF(report)
// Returns: Buffer (PDF file)
```

### pdfAnalyzer.js (referenced)
```javascript
analyzePDFBuffer(buffer)
// Returns: { appreciation, commentsNeedingAttention, ffiScore, meta, ... }

extractMetaFromPDF(buffer)
// Returns: { facultyName, subjectCode, programme, semester, ffiScore }

convertDriveLink(url)
// Converts: Google Drive share link ΓåÆ direct download URL
```

### aiAnalyzer.js (referenced)
```javascript
testGeminiConnection()
// Tests AI service connectivity

analyzeCommentsWithAI(comments)
// Returns: { appreciation, commentsNeedingAttention, ... }
```

### cache.js (referenced)
```javascript
getCached(key)
// Returns: cached value or null

setCache(key, value, ttl)
// Stores value in memory cache
```

### cloudStorage.js (referenced)
```javascript
uploadPdf({ fileName, buffer, hodUser, academicYear, session })
// Returns: { webViewLink, localFilePath }

cleanupOldLocalFiles()
// Removes old PDF files
```

### emailService.js (referenced)
```javascript
emailHODVCApproved({ hodEmail, hodName, department, academicYear, session })
emailHODVCRejected({ hodEmail, hodName, department, academicYear, vcComment })
```

### logger.js (referenced)
```javascript
log(userId, event, description, meta, level)
// Creates activity/system log entry
```

---

## ≡ƒôè DATA FLOW DIAGRAMS

### CSV Upload & Processing Flow
```
1. User uploads Excel file
   Γåô
2. POST /api/process/upload-csv
   Γåô
3. csvParser.parseCSV(buffer)
   Γåô
4. Returns: Array of {pdfLink, facultyName, subjectCode, ...}
   Γåô
5. Frontend displays parsed data
   Γåô
6. User confirms processing
   Γåô
7. For each link: POST /api/process/process-one
   Γåô
8. Download PDF from Google Drive (with retry logic)
   Γåô
9. analyzePDFBuffer(buffer) ΓåÆ AI analysis
   Γåô
10. Create FacultyReport in database
   Γåô
11. Frontend polls: POST /api/process/status
   Γåô
12. Display results to HOD
```

### Report Submission Flow (HOD ΓåÆ VC)
```
1. HOD selects reports
   Γåô
2. POST /api/submissions/send
   Γåô
3. checkSelfApprovalConflict(submission, hodId)
   Γåô
4. IF conflict detected:
   Γö£ΓöÇΓåÆ resolveAlternateApprover()
   Γö£ΓöÇΓåÆ status = 'conflict' or 'escalated'
   ΓööΓöÇΓåÆ Log to AuditLog
   Γåô
5. Create Submission document
   Γåô
6. VC reviews: GET /api/submissions/all
   Γåô
7. VC approves: PATCH /api/submissions/:id/status
   Γåô
8. Send email notifications
   Γåô
9. Create in-app notifications
   Γåô
10. HOD generates PDF: GET /api/submissions/:id/download-pdf
   Γåô
11. generateFeedbackReportPDF()
    Γö£ΓöÇΓåÆ Create cover page with table
    Γö£ΓöÇΓåÆ Download individual PDFs from Drive
    Γö£ΓöÇΓåÆ Append PDFs with signature stamps
    ΓööΓöÇΓåÆ Return final PDF buffer
```

---

## ≡ƒÄ» KEY ARCHITECTURAL PATTERNS

### 1. Multi-Role Support
- User can have multiple roles (HOD + Faculty)
- Workspace switching (`activeWorkspace` in JWT)
- Role-based access control via middleware
- Self-approval conflict detection

### 2. Caching Strategy
- PDF analysis results cached to avoid redundant AI calls
- Cache key based on PDF URL or MD5 hash
- TTL-based expiration

### 3. Retry Logic
- Google Drive downloads: 4 attempts with exponential backoff
- Rate limit handling (429 errors)
- Graceful degradation on failures

### 4. Conflict Resolution
- Self-approval detection using facultyUserId and name regex
- ApprovalPolicy for department-specific rules
- Alternate approver assignment
- Admin escalation path

### 5. Audit Trail
- AuditLog for all state changes
- ActivityLog for user actions
- SystemLog for errors
- Includes: actor, event, target, metadata

### 6. File Storage
- Local storage with cloud backup
- Google Drive integration
- Ephemeral disk handling (Render platform)
- Cleanup of old files

---

## ≡ƒÜÇ DEPLOYMENT CONFIGURATION

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://...

# Authentication
JWT_SECRET=your_jwt_secret

# AI Service
GEMINI_API_KEY=your_google_api_key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Server
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend.com
```

### Package Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.x",
    "mongoose": "^7.x",
    "multer": "^1.4.x",
    "axios": "^1.4.x",
    "jsonwebtoken": "^9.0.x",
    "bcryptjs": "^2.4.x",
    "xlsx": "^0.18.x",
    "adm-zip": "^0.5.x",
    "pdf-lib": "^1.17.x",
    "pdfjs-dist": "^3.x",
    "sharp": "^0.32.x",
    "p-limit": "^3.1.x",
    "nodemailer": "^6.9.x"
  }
}
```

---

This document provides complete code and technical details for the entire PDF extraction and report generation system.
