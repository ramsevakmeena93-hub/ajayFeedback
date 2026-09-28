# PDF Extraction and Report Generation Flow - HOD Module

## Overview
Your system extracts data from PDF feedback reports and Excel/CSV files, analyzes them using AI, and generates comprehensive reports for the HOD (Head of Department).

---

## ≡ƒöä Complete Data Flow

### 1. **Data Input Methods**

#### A. CSV/Excel Upload (Primary Method)
**Route:** `POST /api/process/upload-csv`
**File:** `backend/routes/process.js`

**Process:**
1. HOD uploads an Excel/CSV file containing PDF links
2. System uses `csvParser.js` to extract:
   - PDF/Google Drive links
   - Faculty names
   - Subject codes
   - Course names
   - Programme details
   - Semester information
   - Response count
   - FFI (Faculty Feedback Index) scores
3. Returns parsed data to frontend for HOD review
4. No database records created yet

**Parser Features (`backend/services/csvParser.js`):**
- Handles `.xlsx`, `.xls`, and `.csv` formats
- Extracts hyperlinks from Excel XML structure (most reliable)
- Falls back to cell formulas (`=HYPERLINK(...)`)
- Auto-detects header rows
- Supports multiple URL formats (Google Drive, direct links)
- Deduplicates URLs
- Smart column detection for metadata

#### B. Direct PDF Upload
**Route:** `POST /api/process/upload-pdfs`

**Process:**
1. HOD uploads PDF files directly (up to 50 files, 20MB each)
2. System extracts metadata from each PDF
3. Optionally stores files locally/cloud
4. Processes in background with AI analysis

#### C. Batch Upload (ZIP)
**Route:** `POST /api/process/upload-batch`

**Process:**
1. Upload ZIP file containing multiple PDFs
2. Extracts all PDFs from archive
3. Processes each file with AI analysis
4. Supports large batches (up to 500MB)

---

### 2. **Processing Individual PDFs**

**Route:** `POST /api/process/process-one`
**File:** `backend/routes/process.js`

**Workflow:**
1. HOD confirms which PDFs to process
2. For each PDF:
   - Downloads from Google Drive link
   - Checks cache first (to avoid reprocessing)
   - Calls AI analyzer (`analyzePDFBuffer`)
   - Extracts metadata and student comments
   - Creates `FacultyReport` record in database

**Retry Logic:**
- 4 attempts with exponential backoff
- Handles Google Drive rate limits (429 errors)
- Waits 5s, 10s, 20s between retries

---

### 3. **FacultyReport Model**

**File:** `backend/models/FacultyReport.js`

**Core Fields:**
```javascript
{
  hodId: ObjectId,                    // HOD who uploaded
  facultyUserId: ObjectId,            // Linked faculty account
  
  // Basic Info
  facultyName: String,
  subjectCode: String,
  programme: String,
  semester: String,
  branch: String,                     // e.g., "CSE", "IT"
  section: String,                    // e.g., "A", "B"
  
  // File Links
  pdfLink: String,                    // Original PDF link
  driveLink: String,                  // Google Drive link
  pdfFilePath: String,                // Local storage path
  
  // AI Analysis Results
  appreciation: [String],             // Positive comments
  commentsNeedingAttention: [String], // Issues to address
  appreciationCount: Number,
  attentionCount: Number,
  
  // Metrics
  ffiScore: Number,                   // Faculty Feedback Index (0-5)
  responseCount: Number,              // Number of students who responded
  responsePercent: Number,            // Percentage (e.g., 69.57%)
  registeredStudents: Number,
  commentPercentages: Object,         // {"Excellent": 10, "Very Good": 25, ...}
  
  // Raw Data
  rawStudentComments: [String],       // Original unmodified comments
  commentCategories: Object,          // Categorized by theme
  
  // HOD Actions
  hodRemarks: String,
  actionTaken: String,                // HOD's action plan
  goodComments: [String],
  badComments: [String],
  
  // Faculty Acknowledgment
  facultyAcknowledged: Boolean,
  facultyAcknowledgedAt: Date,
  sentToFacultyAt: Date,
  
  // Status Tracking
  status: String,                     // pending | processed | sent_to_faculty | faculty_approved
  analyzedAt: Date,
  academicYear: String
}
```

---

### 4. **PDF Generation for Reports**

**File:** `backend/services/pdfGenerator.js`
**Function:** `generateFeedbackReportPDF()`

**What it creates:**
A comprehensive PDF report containing:

#### Cover Page:
1. **Institution Header**
   - Logo/header image
   - Institution name: "MADHAV INSTITUTE OF TECHNOLOGY & SCIENCE, GWALIOR"
   
2. **Report Title Section**
   - "Action Taken Report"
   - "Faculty Feedback ΓÇô I (or form number)"
   - Department name
   - Academic year and session
   - Submission and generation dates
   - Average FFI and response rates

3. **Data Table** (11 columns):
   - S.No
   - Faculty Name
   - Code/Batch
   - Course Name
   - Semester
   - FFI Score (color-coded: green ΓëÑ4, amber ΓëÑ3, red <3)
   - Response %
   - Needs Attention
   - Appreciation
   - Action Taken
   - Faculty Signature

4. **Signature Section**
   - HOD signature (auto-embedded if available)
   - PRO-VC signature
   - Faculty signatures in table rows

#### Appended Individual PDFs:
- Downloads each faculty's original feedback PDF from Google Drive
- Appends to main report
- **Stamps signatures** on each PDF:
  - Faculty signature (if registered)
  - HOD signature
  - VC signature
- Uses `pdfjs-dist` to locate signature positions by searching for "HOD", "PRO-VC" text

**Advanced Features:**
- Automatic page breaks
- Dynamic row heights based on content
- Word-wrapping for long text
- Image cropping for signatures (using `sharp`)
- Parallel PDF downloads (max 3 concurrent)
- 25-second timeout protection
- Caching for efficiency

---

### 5. **HOD Report Management**

**File:** `backend/routes/reports.js`

**Key Endpoints:**

#### Get Reports
```
GET /api/reports/my
```
- Returns all reports for the logged-in HOD
- Supports filtering by status and search

#### Edit Report
```
PATCH /api/reports/:id/edit
```
- Update metadata (programme, semester, branch, section)
- Edit comments (appreciation, attention items)
- Add HOD remarks and action taken
- Force-approve without faculty acknowledgment

#### Send to Faculty
```
POST /api/reports/:id/send-to-faculty
POST /api/reports/bulk-send-to-faculty
```
- Changes status to `sent_to_faculty`
- Links faculty user account
- Creates notification for faculty
- Optionally links to TeachingAssignment

#### Delete Reports
```
DELETE /api/reports/:id
DELETE /api/reports/my/all
```
- Only non-submitted, non-approved reports
- Cannot delete if part of VC submission

#### Export CSV
```
GET /api/reports/my/export
```
- Exports all reports to CSV format

---

### 6. **Submission to VC**

**File:** `backend/routes/submissions.js`
**Route:** `POST /api/submissions/send`

**Process:**
1. HOD selects multiple reports
2. System checks for conflicts:
   - Self-approval (HOD is also the faculty)
   - Uses `ApprovalPolicy` to find alternate approver
3. Creates `Submission` document with:
   - Selected reports
   - Academic year and session
   - Approval status
   - Conflict resolution info
4. Generates final PDF report
5. Sends to VC for approval

**VC Actions:**
```
PATCH /api/submissions/:id/status
```
- VC can approve, reject, or send back
- Email notifications sent to HOD
- Creates notifications in system

---

## ≡ƒÄ¿ AI Analysis

**File:** `backend/services/aiAnalyzer.js` (referenced but not shown)

**Capabilities:**
- Categorizes student comments into positive/negative
- Extracts appreciation points
- Identifies issues needing attention
- Generates comment percentages
- Categorizes by themes (Speed, Clarity, Examples, etc.)

---

## ≡ƒôè Data Models Summary

### Primary Models:
1. **FacultyReport** - Individual faculty feedback records
2. **Submission** - Groups of reports sent to VC
3. **User** - Faculty/HOD/VC accounts with signatures
4. **TeachingAssignment** - Links faculty to courses
5. **Notification** - System notifications
6. **ApprovalPolicy** - Conflict resolution rules

---

## ≡ƒöÉ Security & Access Control

**Multi-role Support:**
- HOD can also be a faculty member
- Workspace isolation (HOD workspace vs Faculty workspace)
- Department-scoped access
- Role-based permissions via `requireAnyRole()` middleware

**Ownership Checks:**
- HOD: Can only access reports they created (`hodId`)
- Faculty: Can only see reports sent to them (`facultyUserId`)
- VC/Admin: Full access

---

## ≡ƒÜÇ Key Features

### CSV Parser Intelligence:
- Γ£à Direct hyperlink extraction from Excel XML
- Γ£à HYPERLINK formula parsing
- Γ£à Auto-detect header rows
- Γ£à Multi-column metadata extraction
- Γ£à URL deduplication
- Γ£à Support for concatenated URLs in cells

### PDF Generator Capabilities:
- Γ£à Professional table layout with auto-pagination
- Γ£à Dynamic row heights
- Γ£à Signature embedding and stamping
- Γ£à Color-coded FFI scores
- Γ£à Bulk PDF appending
- Γ£à Watermark/stamp on individual PDFs

### Processing Features:
- Γ£à Batch processing with rate limiting
- Γ£à Caching to avoid reprocessing
- Γ£à Retry logic for network failures
- Γ£à Background processing
- Γ£à Status polling

---

## ≡ƒô¥ Typical User Flow

### For HOD:
1. Upload Excel file with PDF links ΓåÆ `upload-csv`
2. Review parsed data
3. Confirm processing ΓåÆ `process-one` (called for each PDF)
4. Wait for AI analysis to complete
5. Review reports in dashboard ΓåÆ `GET /api/reports/my`
6. Edit comments, add action taken ΓåÆ `PATCH /api/reports/:id/edit`
7. Send to faculty for acknowledgment ΓåÆ `POST /api/reports/:id/send-to-faculty`
8. Submit to VC ΓåÆ `POST /api/submissions/send`
9. VC approves ΓåÆ HOD generates final PDF

### For Faculty:
1. Receives notification
2. Views report ΓåÆ `GET /api/reports/:id`
3. Reviews feedback
4. Acknowledges ΓåÆ `POST /api/reports/:id/acknowledge`

### For VC:
1. Receives submission from HOD
2. Reviews reports ΓåÆ `GET /api/submissions/for-vc`
3. Approves/Rejects ΓåÆ `PATCH /api/submissions/:id/status`
4. System sends notifications and emails

---

## ≡ƒ¢á∩╕Å Technical Stack

- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose ODM)
- **File Parsing:** 
  - `xlsx` - Excel file parsing
  - `adm-zip` - ZIP archive handling
  - `pdfjs-dist` - PDF text extraction
  - `pdf-lib` - PDF generation and manipulation
- **AI:** Google Gemini (via `aiAnalyzer.js`)
- **Image Processing:** `sharp` (signature cropping)
- **Caching:** In-memory cache for PDF results
- **Concurrency:** `p-limit` for parallel processing

---

## ≡ƒôî Important Notes

1. **Rate Limiting:** Google Drive has rate limits - system implements exponential backoff
2. **Caching:** Processed PDFs are cached to avoid redundant AI calls
3. **Memory Management:** Uses `multer.memoryStorage()` for file uploads
4. **Timeout Protection:** 25-second timeout on PDF appending to prevent Render/hosting platform kills
5. **Signature Detection:** Uses text search for "HOD", "PRO-VC" keywords to place stamps
6. **Conflict Resolution:** Self-approval detection prevents HODs from approving their own reports

---

## ≡ƒöº Configuration

**File Size Limits:**
- CSV/Excel: 20 MB
- Individual PDF: 20 MB
- Batch ZIP: 500 MB, up to 500 files

**Timeouts:**
- PDF download: 30 seconds
- Processing request: 120 seconds
- Batch upload: 600 seconds

**Concurrency:**
- Parallel PDF downloads: 3
- Processing limit: 5 concurrent

---

This system provides a complete end-to-end solution for managing, analyzing, and reporting faculty feedback in an academic institution, with strong separation of concerns between HOD, Faculty, and VC roles.
