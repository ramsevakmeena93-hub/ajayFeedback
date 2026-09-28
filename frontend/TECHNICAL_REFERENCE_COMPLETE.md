# Complete Technical Reference - PDF Extraction & Report System

## ≡ƒôª DATABASE MODELS

### 1. FacultyReport Model
**File:** `backend/models/FacultyReport.js`

```javascript
const facultyReportSchema = new mongoose.Schema({
  // Ownership
  hodId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  facultyUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  // Core Fields (editable by HOD)
  facultyName: { type: String, default: '' },
  subjectCode: { type: String, default: '' },
  programme: { type: String, default: '' },
  semester: { type: String, default: '' },
  
  // Location Fields
  branch: { type: String, default: '' },        // e.g. "CSE", "IT", "EC"
  section: { type: String, default: '' },       // e.g. "A", "B", "C"
  
  // File References
  pdfLink: { type: String, default: '' },
  driveLink: { type: String, default: '' },
  pdfFilePath: { type: String, default: '' },
  
  // Teaching Assignment Link
  teachingAssignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeachingAssignment',
    default: null
  },
  
  // AI Analysis Results
  appreciation: [{ type: String }],
  commentsNeedingAttention: [{ type: String }],
  appreciationCount: { type: Number, default: 0 },
  attentionCount: { type: Number, default: 0 },
  
  // Metrics
  ffiScore: { type: Number, default: null },
  responseCount: { type: Number, default: null },
  responsePercent: { type: Number, default: null },
  registeredStudents: { type: Number, default: null },
  linkSent: { type: Number, default: null },
  
  // Comment Analysis
  commentPercentages: { type: Object, default: {} },     // { "Excellent": 10, "Very Good": 25 }
  rawStudentComments: [{ type: String }],
  commentCategories: { type: Object, default: {} },
  
  // HOD Editable
  hodRemarks: { type: String, default: '' },
  actionTaken: { type: String, default: '' },
  goodComments: [{ type: String }],
  badComments: [{ type: String }],
  
  // Faculty Acknowledgment
  facultyAcknowledged: { type: Boolean, default: false },
  facultyAcknowledgedAt: { type: Date },
  sentToFacultyAt: { type: Date },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'processed', 'error', 'sent_to_faculty', 'faculty_approved'], 
    default: 'pending' 
  },
  errorMessage: { type: String },
  analyzedAt: { type: Date },
  academicYear: { type: String, default: () => new Date().getFullYear().toString() }
}, { timestamps: true });
```

**Status Flow:**
- `pending` ΓåÆ `processed` ΓåÆ `sent_to_faculty` ΓåÆ `faculty_approved`
- `pending` ΓåÆ `error` (if processing fails)

---

### 2. Submission Model
**File:** `backend/models/Submission.js` (referenced)

```javascript
{
  hodId: ObjectId,                    // HOD who submitted
  reports: [ObjectId],                // Array of FacultyReport IDs
  academicYear: String,               // e.g., "2025"
  session: String,                    // "jan-may" or "jul-dec"
  feedbackFormNo: String,             // e.g., "I", "II"
  department: String,
  
  // Status
  status: String,                     // "submitted" | "approved" | "rejected" | "sent_back"
  
  // VC Feedback
  vcComment: String,
  vcApprovedAt: Date,
  
  // Conflict Resolution
  conflictDetected: Boolean,
  conflictReason: String,
  conflictDetectedAt: Date,
  alternateApproverId: ObjectId,
  escalatedToAdmin: Boolean,
  escalatedAt: Date,
  
  // Report Generation
  finalReportUrl: String,
  finalReportDate: Date,
  submissionDate: Date,
  
  submittedFromWorkspace: String,     // "hod" workspace
  
  timestamps: true
}
```

---

### 3. User Model
**File:** `backend/models/User.js`

```javascript
{
  name: String,
  email: String,
  password: String,                   // Hashed
  role: String,                       // "faculty" | "hod" | "vc" | "admin"
  department: String,
  signatureImage: String,             // Base64 data URL
  activeWorkspace: String,            // Current workspace ("hod" | "faculty" | "vc" | "admin")
  
  // Multi-role support
  roles: [String],                    // Can have multiple roles
  
  timestamps: true
}
```

---

### 4. TeachingAssignment Model
**File:** `backend/models/TeachingAssignment.js`

```javascript
{
  facultyUserId: ObjectId,
  subjectCode: String,
  subjectName: String,
  branch: String,
  section: String,
  semester: String,
  academicYear: String,
  active: Boolean,
  
  timestamps: true
}
```

---

### 5. Notification Model
**File:** `backend/models/Notification.js`

```javascript
{
  userId: ObjectId,
  type: String,                       // "sent_to_faculty" | "vc_approved" | "vc_rejected" | etc.
  message: String,
  reportId: ObjectId,
  submissionId: ObjectId,
  read: Boolean,
  
  timestamps: true
}
```

---

### 6. ApprovalPolicy Model
**File:** `backend/models/ApprovalPolicy.js`

```javascript
{
  department: String,
  conflictType: String,               // "self_approval" | etc.
  resolutionStrategy: String,         // "alternate_approver" | "escalate_to_admin"
  alternateApproverId: ObjectId,
  active: Boolean,
  
  timestamps: true
}
```

---

### 7. ActivityLog Model
**File:** `backend/models/ActivityLog.js`

```javascript
{
  actorId: ObjectId,
  actorRole: String,
  workspace: String,
  event: String,
  description: String,
  targetType: String,                 // "submission" | "report" | "user"
  targetId: ObjectId,
  meta: Object,
  
  timestamp: Date
}
```

---

### 8. AuditLog Model
**File:** `backend/models/AuditLog.js`

```javascript
{
  userId: ObjectId,
  action: String,
  resourceType: String,
  resourceId: ObjectId,
  changes: Object,
  ipAddress: String,
  userAgent: String,
  
  timestamp: Date
}
```

---

### 9. SystemLog Model
**File:** `backend/models/SystemLog.js`

```javascript
{
  level: String,                      // "info" | "warn" | "error"
  message: String,
  module: String,
  meta: Object,
  
  timestamp: Date
}
```

---

### 10. UserRole Model
**File:** `backend/models/UserRole.js`

```javascript
{
  userId: ObjectId,
  role: String,                       // "hod" | "faculty" | "vc" | "admin"
  departmentScope: String,
  active: Boolean,
  
  timestamps: true
}
```

---

## ≡ƒîÉ API ENDPOINTS

### CSV/EXCEL & PDF PROCESSING

#### 1. Upload CSV/Excel File
```
POST /api/process/upload-csv
```
**File:** `backend/routes/process.js` (Line 38)
**Auth:** Required
**Body:** Multipart form data with file
**Returns:** 
```json
{
  "message": "Found 15 PDF links",
  "links": [
    {
      "pdfLink": "https://drive.google.com/...",
      "facultyName": "Dr. John Doe",
      "subjectCode": "CS101",
      "courseName": "Data Structures",
      "programme": "B.Tech Computer Science",
      "semester": "3",
      "responseCount": 45,
      "ffiScore": 4.2
    }
  ],
  "total": 15
}
```

---

#### 2. Process Single PDF
```
POST /api/process/process-one
```
**File:** `backend/routes/process.js` (Line 71)
**Auth:** Required
**Body:**
```json
{
  "pdfLink": "https://drive.google.com/...",
  "sno": 1,
  "responseCount": 45,
  "responsePercent": 85.5
}
```
**Returns:**
```json
{
  "report": { /* FacultyReport object */ },
  "sno": 1
}
```

---

#### 3. Check Processing Status
```
POST /api/process/status
```
**File:** `backend/routes/process.js` (Line 142)
**Auth:** Required
**Body:**
```json
{
  "reportIds": ["id1", "id2", "id3"]
}
```
**Returns:**
```json
{
  "total": 15,
  "processed": 12,
  "errors": 1,
  "pending": 2,
  "reports": [ /* array of report summaries */ ]
}
```

---

#### 4. Scan PDFs (Metadata Only)
```
POST /api/process/scan-pdfs
```
**File:** `backend/routes/process.js` (Line 158)
**Auth:** Required
**Body:** Multipart form data with PDF files (up to 50)
**Returns:**
```json
{
  "results": [
    {
      "filename": "faculty1.pdf",
      "facultyName": "Dr. John Doe",
      "subjectCode": "CS101",
      "programme": "B.Tech CS",
      "semester": "3",
      "ffiScore": 4.2,
      "error": null
    }
  ]
}
```

---

#### 5. Upload & Process PDFs Directly
```
POST /api/process/upload-pdfs
```
**File:** `backend/routes/process.js` (Line 181)
**Auth:** Required
**Body:** Multipart form data
- `pdfs[]`: PDF files (up to 50)
- `metadata`: JSON string with metadata array
**Returns:**
```json
{
  "message": "Processing 10 PDF(s) in background",
  "reportIds": ["id1", "id2", ...],
  "total": 10
}
```

---

#### 6. Batch Upload (ZIP or Multiple PDFs)
```
POST /api/process/upload-batch
```
**File:** `backend/routes/process.js` (Line 262)
**Auth:** Required
**Body:** Multipart form data with ZIP or PDFs
**Limits:** 500MB, 500 files

---

#### 7. Debug Excel Parser
```
POST /api/debug/parse-excel
```
**File:** `backend/server.js` (Line 82)
**Body:** Multipart form data with Excel file
**Returns:** Parsed results for debugging

---

### REPORT MANAGEMENT (HOD)

#### 8. Get My Reports
```
GET /api/reports/my
```
**File:** `backend/routes/reports.js` (Line 619)
**Auth:** Required (HOD role)
**Query Params:**
- `status`: Filter by status
- `search`: Search faculty name or subject code
**Returns:** Array of FacultyReport objects

---

#### 9. Get Single Report
```
GET /api/reports/:id
```
**File:** `backend/routes/reports.js` (Line 637)
**Auth:** Required
**Returns:** FacultyReport object (with access control)

---

#### 10. Edit Report
```
PATCH /api/reports/:id/edit
```
**File:** `backend/routes/reports.js` (Line 366)
**Auth:** Required (HOD role)
**Body:**
```json
{
  "facultyName": "Dr. John Doe",
  "subjectCode": "CS101",
  "programme": "B.Tech CS",
  "semester": "3",
  "branch": "CSE",
  "section": "A",
  "hodRemarks": "Good performance",
  "actionTaken": "Maintain current teaching methods",
  "commentsNeedingAttention": ["Point 1", "Point 2"],
  "appreciation": ["Excellent teaching", "Clear explanations"],
  "responseCount": 45,
  "responsePercent": 85.5,
  "status": "faculty_approved"
}
```
**Returns:** Updated FacultyReport

---

#### 11. Update HOD Remarks
```
PATCH /api/reports/:id/remarks
```
**File:** `backend/routes/reports.js` (Line 677)
**Auth:** Required (HOD role)
**Body:**
```json
{
  "hodRemarks": "Excellent work",
  "actionTaken": "Continue with current approach"
}
```

---

#### 12. Send Report to Faculty
```
POST /api/reports/:id/send-to-faculty
```
**File:** `backend/routes/reports.js` (Line 344)
**Auth:** Required (HOD role)
**Returns:** Updated report with status "sent_to_faculty"

---

#### 13. Bulk Send to Faculty
```
POST /api/reports/bulk-send-to-faculty
```
**File:** `backend/routes/reports.js` (Line 236)
**Auth:** Required (HOD role)
**Body:**
```json
{
  "reportIds": ["id1", "id2", "id3"]
}
```
**Returns:**
```json
{
  "sent": 3,
  "total": 3
}
```

---

#### 14. Delete Single Report
```
DELETE /api/reports/:id
```
**File:** `backend/routes/reports.js` (Line 157)
**Auth:** Required (HOD role)
**Note:** Cannot delete submitted or faculty-approved reports

---

#### 15. Delete All Unapproved Reports
```
DELETE /api/reports/my/all
```
**File:** `backend/routes/reports.js` (Line 171)
**Auth:** Required (HOD role)
**Returns:**
```json
{
  "deleted": 12
}
```

---

#### 16. Export Reports as CSV
```
GET /api/reports/my/export
```
**File:** `backend/routes/reports.js` (Line 291)
**Auth:** Required (HOD role)
**Returns:** CSV file download

---

#### 17. Re-analyze with AI
```
POST /api/reports/:id/ai-analyze
```
**File:** `backend/routes/reports.js` (Line 82)
**Auth:** Required (HOD role)
**Body:**
```json
{
  "extraComments": ["Additional comment 1", "Additional comment 2"]
}
```

---

#### 18. Fix Metadata from PDFs
```
POST /api/reports/my/fix-metadata
```
**File:** `backend/routes/reports.js` (Line 106)
**Auth:** Required (HOD role)
**Returns:**
```json
{
  "fixed": 8,
  "total": 15
}
```

---

#### 19. Test AI Connection
```
GET /api/reports/ai/test
```
**File:** `backend/routes/reports.js` (Line 77)
**Auth:** Required
**Returns:** AI connection status

---

### FACULTY ENDPOINTS

#### 20. Get My Reports (Faculty)
```
GET /api/reports/faculty/my
```
**File:** `backend/routes/reports.js` (Line 556)
**Auth:** Required (Faculty role)
**Query Params:**
- `year`: Filter by academic year
- `semester`: Filter by semester
**Returns:** Array of reports sent to faculty

---

#### 21. Get Faculty Analysis Summary
```
GET /api/reports/faculty/analysis
```
**File:** `backend/routes/reports.js` (Line 572)
**Auth:** Required (Faculty role)
**Query Params:**
- `year`: Academic year filter
- `semester`: Semester filter
**Returns:**
```json
{
  "reports": [ /* array */ ],
  "summary": {
    "totalReports": 15,
    "avgFFI": 4.2,
    "totalAppreciation": 45,
    "totalAttention": 12,
    "grade": "A",
    "ffiBySubject": [ /* array */ ],
    "commentPercentages": { /* object */ },
    "years": ["2025", "2024"],
    "semesters": ["1", "2", "3"]
  }
}
```

---

#### 22. Faculty Advanced Analytics
```
GET /api/reports/faculty/advanced-analytics
```
**File:** `backend/routes/reports.js` (Line 481)
**Auth:** Required (Faculty role)
**Returns:**
```json
{
  "trend": [ /* FFI trend over time */ ],
  "improvement": {
    "diff": 0.3,
    "direction": "up",
    "from": "2024-Sem2",
    "to": "2025-Sem1"
  },
  "deptAvgFFI": 3.8,
  "myAvgFFI": 4.2,
  "dimensions": {
    "Speed": 2,
    "Clarity": 5,
    "Examples": 3,
    "Availability": 1,
    "Material": 4
  },
  "recommendations": [ /* array */ ],
  "totalReports": 15
}
```

---

#### 23. Acknowledge Report (Faculty)
```
POST /api/reports/:id/acknowledge
```
**File:** `backend/routes/reports.js` (Line 656)
**Auth:** Required (Faculty role)
**Returns:** Updated report with status "faculty_approved"

---

### SUBMISSION ENDPOINTS (HOD ΓåÆ VC)

#### 24. Send Reports to VC
```
POST /api/submissions/send
```
**File:** `backend/routes/submissions.js` (Line 30)
**Auth:** Required (HOD role, in HOD workspace)
**Body:**
```json
{
  "reportIds": ["id1", "id2", "id3"],
  "academicYear": "2025",
  "session": "jan-may",
  "feedbackFormNo": "I"
}
```
**Returns:** Created Submission object
**Note:** Includes self-approval conflict detection

---

#### 25. Get My Submissions (HOD)
```
GET /api/submissions/my
```
**File:** `backend/routes/submissions.js` (Line 195)
**Auth:** Required (HOD role)
**Returns:** Array of Submission objects with populated reports

---

#### 26. Get Submissions for VC Review
```
GET /api/submissions/for-vc
```
**File:** `backend/routes/submissions.js` (Line 220)
**Auth:** Required (VC role)
**Returns:** Submissions with status "approved"

---

#### 27. Get All Submissions (Admin)
```
GET /api/submissions/all
```
**File:** `backend/routes/submissions.js` (Line 251)
**Auth:** Required (Admin role)
**Returns:** All submissions

---

#### 28. Update Submission Status (VC)
```
PATCH /api/submissions/:id/status
```
**File:** `backend/routes/submissions.js` (Line 280)
**Auth:** Required (VC role)
**Body:**
```json
{
  "status": "approved",
  "vcComment": "Excellent work by the department"
}
```
**Status Options:** "approved" | "rejected" | "sent_back"
**Note:** Sends email notifications to HOD

---

#### 29. Get Submission by ID
```
GET /api/submissions/:id
```
**File:** `backend/routes/submissions.js` (Line 271)
**Auth:** Required
**Returns:** Submission with populated HOD and reports

---

#### 30. Generate Final PDF Report
```
GET /api/submissions/:id/pdf
```
**File:** `backend/routes/submissions.js` (Line 447)
**Auth:** Required
**Query Params:**
- `preview=true`: Generate without signatures
- `withoutSignatures=true`: Skip signature embedding
**Returns:** PDF file download

---

### WORKSPACE MANAGEMENT

#### 31. Get Current Workspace
```
GET /api/workspace/current
```
**File:** `backend/routes/workspace.js` (Line 85)
**Auth:** Required
**Returns:**
```json
{
  "activeWorkspace": "hod",
  "availableWorkspaces": ["hod", "faculty"],
  "workspaceLabels": {
    "hod": "HOD Workspace",
    "faculty": "Faculty Workspace"
  }
}
```

---

#### 32. Switch Workspace
```
POST /api/workspace/switch
```
**File:** `backend/routes/workspace.js` (Line 111)
**Auth:** Required
**Body:**
```json
{
  "workspace": "faculty"
}
```

---

### NOTIFICATION ENDPOINTS

#### 33. Get My Notifications
```
GET /api/notifications/my
```
**File:** `backend/routes/notifications.js`
**Auth:** Required
**Returns:** Array of notifications

---

#### 34. Mark Notification as Read
```
PATCH /api/notifications/:id/read
```
**Auth:** Required
**Returns:** Updated notification

---

#### 35. Delete Notification
```
DELETE /api/notifications/:id
```
**Auth:** Required

---

### ADMIN ENDPOINTS

#### 36. Get All Users
```
GET /api/admin/users
```
**File:** `backend/routes/admin.js`
**Auth:** Required (Admin role)
**Returns:** Array of users

---

#### 37. Create User
```
POST /api/admin/users
```
**Auth:** Required (Admin role)
**Body:** User object

---

#### 38. Update User
```
PATCH /api/admin/users/:id
```
**Auth:** Required (Admin role)

---

#### 39. Delete User
```
DELETE /api/admin/users/:id
```
**Auth:** Required (Admin role)

---

## ≡ƒöº SERVICE FUNCTIONS

### CSV Parser Service
**File:** `backend/services/csvParser.js`

#### Function: `parseCSV(buffer)`
**Purpose:** Extract PDF links and metadata from Excel/CSV files

**Input:** Buffer (file buffer)

**Returns:** Array of objects
```javascript
[
  {
    pdfLink: "https://...",
    facultyName: "Dr. John Doe",
    subjectCode: "CS101",
    courseName: "Data Structures",
    programme: "B.Tech CS",
    semester: "3",
    responseCount: 45,
    ffiScore: 4.2
  }
]
```

**Features:**
- Extracts hyperlinks from Excel XML (`extractHyperlinksFromXlsx`)
- Parses HYPERLINK formulas
- Auto-detects header rows
- Multi-column metadata extraction
- URL deduplication

---

### PDF Analyzer Service
**File:** `backend/services/pdfAnalyzer.js` (referenced)

#### Function: `analyzePDFBuffer(buffer)`
**Purpose:** Extract text and analyze student feedback from PDF

**Returns:**
```javascript
{
  appreciation: ["Excellent teaching"],
  commentsNeedingAttention: ["Speak slower"],
  appreciationCount: 12,
  attentionCount: 5,
  ffiScore: 4.2,
  responseCount: 45,
  responsePercent: 85.5,
  rawStudentComments: [ /* array */ ],
  commentCategories: { /* object */ },
  commentPercentages: { "Excellent": 30, "Very Good": 40 },
  meta: {
    facultyName: "Dr. John Doe",
    subjectCode: "CS101",
    programme: "B.Tech CS",
    semester: "3"
  },
  analyzedAt: Date
}
```

#### Function: `extractMetaFromPDF(buffer)`
**Purpose:** Extract only metadata without AI analysis

#### Function: `convertDriveLink(url)`
**Purpose:** Convert Google Drive share link to direct download link

**Input:** 
- `https://drive.google.com/file/d/FILE_ID/view`
- `https://drive.google.com/open?id=FILE_ID`

**Output:** `https://drive.google.com/uc?export=download&id=FILE_ID`

---

### PDF Generator Service
**File:** `backend/services/pdfGenerator.js`

#### Function: `generateFeedbackReportPDF(options)`
**Purpose:** Generate comprehensive PDF report

**Parameters:**
```javascript
{
  submission: SubmissionObject,
  reports: [FacultyReportObject],
  hodUser: UserObject,
  vcUser: UserObject,
  approvedAt: Date,
  isPreview: Boolean,              // Skip signature embedding
  withoutSignatures: Boolean       // Don't download/stamp individual PDFs
}
```

**Returns:** Buffer (PDF file)

**Internal Functions:**
- `drawHeader(page, y)` - Draw institution header
- `drawTableHeader(page, y)` - Draw table column headers
- `wrap(text, maxChars)` - Word wrap text
- `calcLines(text, colW, fontSize)` - Calculate wrapped line count
- `embedSig(b64)` - Embed base64 signature image
- `cropAndEmbedSig(b64)` - Crop whitespace and embed signature
- `convertDriveLink(url)` - Convert Drive links
- `downloadWithRetry(url, retries)` - Download with retry logic

**Features:**
- A4 Landscape (842x595pt)
- 11-column table layout
- Dynamic row heights
- Auto-pagination
- Color-coded FFI scores
- Signature embedding (HOD, VC, Faculty)
- Appends individual PDFs
- Stamps signatures on appended PDFs
- Page numbering

---

#### Function: `generateIndividualFacultyPDF(report)`
**Purpose:** Generate single faculty report PDF

**Parameters:** FacultyReport object

**Returns:** Buffer (PDF file)

---

### AI Analyzer Service
**File:** `backend/services/aiAnalyzer.js` (referenced)

#### Function: `testGeminiConnection()`
**Purpose:** Test AI service connectivity

#### Function: `analyzeCommentsWithAI(comments)`
**Purpose:** Analyze comments using Google Gemini AI

**Input:** Array of comment strings

**Returns:**
```javascript
{
  appreciation: ["Positive comment 1"],
  commentsNeedingAttention: ["Issue 1"],
  appreciationCount: 10,
  attentionCount: 5
}
```

---

### Cloud Storage Service
**File:** `backend/services/cloudStorage.js` (referenced)

#### Function: `uploadPdf(options)`
**Purpose:** Upload PDF to cloud/local storage

**Parameters:**
```javascript
{
  fileName: String,
  buffer: Buffer,
  hodUser: UserObject,
  academicYear: String,
  session: String
}
```

**Returns:**
```javascript
{
  webViewLink: "https://...",
  localFilePath: "/path/to/file.pdf"
}
```

#### Function: `cleanupOldLocalFiles()`
**Purpose:** Delete old PDF files from local storage

---

### Cache Service
**File:** `backend/services/cache.js` (referenced)

#### Function: `getCached(key)`
**Purpose:** Get cached value

#### Function: `setCache(key, value, ttl)`
**Purpose:** Store value in cache

---

### Email Service
**File:** `backend/services/emailService.js` (referenced)

#### Function: `emailHODVCApproved(options)`
**Purpose:** Send email when VC approves submission

**Parameters:**
```javascript
{
  hodEmail: String,
  hodName: String,
  department: String,
  academicYear: String,
  session: String
}
```

#### Function: `emailHODVCRejected(options)`
**Purpose:** Send email when VC rejects submission

---

### Logger Service
**File:** `backend/services/logger.js`

#### Function: `log(userId, event, description, meta, level)`
**Purpose:** Create activity/system log entry

---

## ≡ƒöÉ MIDDLEWARE

### Authentication Middleware
**File:** `backend/routes/middleware.js`

#### `authMiddleware`
**Purpose:** Verify JWT token and attach user to request

**Usage:** Applied to all protected routes

**Sets:** `req.user` with user data

---

#### `requireRole(role)`
**Purpose:** Require specific single role

**Example:** `requireRole('hod')`

---

#### `requireAnyRole(...roles)`
**Purpose:** Require any of the specified roles

**Example:** `requireAnyRole('hod', 'admin')`

---

#### `requireWorkspace(workspace)`
**Purpose:** Require user to be in specific workspace

**Example:** `requireWorkspace('hod')`

**Validates:** `req.user.activeWorkspace === workspace`

---

## ≡ƒôè HELPER FUNCTIONS

### Report Helpers
**File:** `backend/routes/reports.js`

#### `getFacultyFirstName(userId)`
**Purpose:** Extract first name from user

#### `buildFacultyQuery(userId, extraFilters, useAssignments)`
**Purpose:** Build MongoDB query for faculty reports with assignment filtering

**Parameters:**
- `userId`: Faculty user ID
- `extraFilters`: Additional filters (year, semester, etc.)
- `useAssignments`: Whether to restrict by teaching assignments

**Returns:** MongoDB query object

---

## ≡ƒÄ¿ FRONTEND INTEGRATION NOTES

### CSV Upload Flow
1. User selects Excel file
2. POST to `/api/process/upload-csv`
3. Display parsed links in table
4. User reviews and confirms
5. For each link: POST to `/api/process/process-one`
6. Poll `/api/process/status` for progress
7. Display results

### Expected Frontend State
```javascript
{
  uploadedLinks: [],          // From upload-csv response
  processing: {
    total: 15,
    completed: 8,
    failed: 1,
    pending: 6
  },
  reports: []                 // Processed FacultyReport objects
}
```

---

## ≡ƒô¥ ENUMERATIONS

### Report Status
- `pending` - Created, not yet processed
- `processed` - AI analysis complete
- `error` - Processing failed
- `sent_to_faculty` - Sent to faculty for review
- `faculty_approved` - Faculty acknowledged

### Submission Status
- `submitted` - Sent to VC
- `approved` - VC approved
- `rejected` - VC rejected
- `sent_back` - VC sent back for revision

### User Roles
- `faculty` - Faculty member
- `hod` - Head of Department
- `vc` - Vice Chancellor
- `admin` - System administrator

### Notification Types
- `sent_to_faculty` - Report sent to faculty
- `faculty_approved` - Faculty acknowledged report
- `hod_force_approved` - HOD force-approved report
- `vc_approved` - VC approved submission
- `vc_rejected` - VC rejected submission

### Session Types
- `jan-may` - January to May session
- `jul-dec` - July to December session

---

## ≡ƒöº CONFIGURATION

### File Size Limits
```javascript
// CSV/Excel upload
csvUpload: { fileSize: 20 * 1024 * 1024 }  // 20MB

// PDF upload
pdfUpload: { fileSize: 20 * 1024 * 1024, files: 50 }  // 20MB each, max 50 files

// Batch upload
batchUpload: { fileSize: 500 * 1024 * 1024, files: 500 }  // 500MB total, 500 files
```

### Timeouts
```javascript
// Request timeouts
processOne: 120000ms       // 2 minutes
batchUpload: 600000ms      // 10 minutes

// Download timeout
axios: 30000ms             // 30 seconds

// PDF append timeout
appendTimeout: 25000ms     // 25 seconds
```

### Concurrency Limits
```javascript
// PDF downloads
pLimit(3)                  // Max 3 concurrent downloads

// Processing
pLimit(5)                  // Max 5 concurrent AI analyses
```

### Retry Configuration
```javascript
// Drive download retries
maxRetries: 4
backoffDelays: [5000, 10000, 20000]  // Exponential with jitter
```

---

## ≡ƒùä∩╕Å DATABASE INDEXES

### Recommended Indexes

```javascript
// FacultyReport
{ hodId: 1, createdAt: -1 }
{ facultyUserId: 1, status: 1 }
{ status: 1 }
{ subjectCode: 1, facultyName: 1 }
{ academicYear: 1, semester: 1 }

// Submission
{ hodId: 1, createdAt: -1 }
{ status: 1 }
{ academicYear: 1, session: 1 }

// User
{ email: 1 } (unique)
{ role: 1 }

// TeachingAssignment
{ facultyUserId: 1, active: 1 }
{ subjectCode: 1, branch: 1, section: 1 }

// Notification
{ userId: 1, read: 1, createdAt: -1 }
```

---

## ≡ƒÜÇ DEPLOYMENT NOTES

### Environment Variables Required
```bash
# Database
MONGODB_URI=mongodb://...

# JWT
JWT_SECRET=...

# AI Service
GEMINI_API_KEY=...

# Email (optional)
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...

# Server
PORT=5000
NODE_ENV=production

# Frontend URL (for CORS)
CLIENT_URL=https://...
```

### Startup Commands
```bash
# Install dependencies
npm install

# Run migrations/seeds
node backend/seed_hods.js

# Start server
npm start

# Development
npm run dev
```

---

## ≡ƒº¬ TESTING ENDPOINTS

### Debug Parser
```bash
curl -X POST http://localhost:5000/api/debug/parse-excel \
  -F "file=@feedback.xlsx"
```

### Test AI
```bash
curl http://localhost:5000/api/reports/ai/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Health Check
```bash
curl http://localhost:5000/api/health
```

---

This document provides complete technical reference for all models, APIs, functions, and configurations in the PDF extraction and report generation system.
