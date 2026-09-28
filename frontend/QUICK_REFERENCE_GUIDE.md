# Quick Reference Guide - PDF Extraction System

## ≡ƒÄ» WHAT THIS SYSTEM DOES

This is a **Faculty Feedback Management System** for MADHAV INSTITUTE OF TECHNOLOGY & SCIENCE. It allows:
1. **HODs** to upload Excel files containing PDF feedback links
2. **AI** to automatically analyze feedback and categorize comments
3. **Faculty** to review and acknowledge their feedback
4. **VC** to approve final reports
5. **System** to generate comprehensive PDF reports with signatures

---

## ≡ƒôé FILES YOU NEED TO KNOW

### Core Models (Database)
| File | Purpose |
|------|---------|
| `backend/models/FacultyReport.js` | Individual faculty feedback report |
| `backend/models/Submission.js` | Group of reports sent to VC |
| `backend/models/User.js` | User accounts (HOD/Faculty/VC/Admin) |

### Core Routes (APIs)
| File | Purpose |
|------|---------|
| `backend/routes/process.js` | CSV upload & PDF processing |
| `backend/routes/reports.js` | Report CRUD operations |
| `backend/routes/submissions.js` | HOD ΓåÆ VC workflow |
| `backend/routes/middleware.js` | Authentication & authorization |

### Core Services (Business Logic)
| File | Purpose |
|------|---------|
| `backend/services/csvParser.js` | Excel/CSV PDF link extraction |
| `backend/services/pdfGenerator.js` | PDF report generation |
| `backend/services/pdfAnalyzer.js` | PDF text extraction |
| `backend/services/aiAnalyzer.js` | Google Gemini AI analysis |

---

## ≡ƒöä TYPICAL USER FLOW

### For HOD:
```
1. Login ΓåÆ Switch to HOD Workspace
2. Upload Excel file (containing PDF links)
3. System parses file and shows preview
4. Confirm processing
5. Wait for AI analysis to complete
6. Review reports in dashboard
7. Edit comments, add "Action Taken"
8. Send reports to faculty for acknowledgment
9. Submit approved reports to VC
10. After VC approval, download final PDF
```

### For Faculty:
```
1. Login ΓåÆ Switch to Faculty Workspace
2. Receive notification about new feedback
3. View feedback report
4. Read AI-analyzed comments
5. Acknowledge report (if satisfied)
6. View analytics and trends
```

### For VC:
```
1. Login ΓåÆ VC Workspace
2. View submissions from HODs
3. Review department reports
4. Approve or Reject with comments
5. System generates final PDF with signatures
```

---

## ≡ƒîÉ KEY API ENDPOINTS

### CSV/Excel Upload
```
POST /api/process/upload-csv
Body: multipart/form-data with Excel file
Returns: { links: [...], total: 15 }
```

### Process PDF
```
POST /api/process/process-one
Body: { pdfLink: "https://...", sno: 1 }
Returns: { report: FacultyReport }
```

### Get Reports
```
GET /api/reports/my
Returns: Array of FacultyReport objects
```

### Send to Faculty
```
POST /api/reports/:id/send-to-faculty
Returns: Updated report with status "sent_to_faculty"
```

### Submit to VC
```
POST /api/submissions/send
Body: { reportIds: [...], academicYear: "2025" }
Returns: Submission object (with conflict detection)
```

### VC Approve
```
PATCH /api/submissions/:id/status
Body: { status: "approved", vcComment: "..." }
Returns: Updated submission
```

### Download PDF
```
GET /api/submissions/:id/download-pdf
Returns: PDF file download
```

---

## ≡ƒôè DATABASE MODELS - QUICK VIEW

### FacultyReport
```javascript
{
  hodId: ObjectId,              // WHO created it
  facultyUserId: ObjectId,       // WHO it's about
  facultyName: String,           // Name
  subjectCode: String,           // e.g., "CS101"
  programme: String,             // e.g., "B.Tech CS"
  semester: String,              // e.g., "3"
  
  // AI Analysis
  appreciation: [String],        // Positive comments
  commentsNeedingAttention: [String], // Issues
  ffiScore: Number,             // 0-5 rating
  responseCount: Number,         // Number of responses
  
  // HOD Actions
  actionTaken: String,
  hodRemarks: String,
  
  // Status
  status: "pending" | "processed" | "sent_to_faculty" | "faculty_approved"
}
```

### Submission
```javascript
{
  hodId: ObjectId,
  reports: [ObjectId],           // Array of FacultyReport IDs
  academicYear: String,
  session: "jan-may" | "jul-dec",
  
  status: "submitted" | "approved" | "rejected" | "conflict" | "escalated",
  
  vcComment: String,
  alternateApproverId: ObjectId, // If conflict detected
}
```

---

## ≡ƒÄ¿ AI ANALYSIS OUTPUT

### What AI Extracts:
```javascript
{
  appreciation: [
    "Excellent teaching methods",
    "Very clear explanations",
    "Always available for doubts"
  ],
  commentsNeedingAttention: [
    "Please speak slower",
    "Need more practical examples",
    "Course completion is delayed"
  ],
  ffiScore: 4.2,
  responseCount: 45,
  commentPercentages: {
    "Excellent": 35,
    "Very Good": 40,
    "Good": 20,
    "Satisfactory": 5
  }
}
```

---

## ≡ƒôä PDF GENERATION

### What Gets Generated:

1. **Cover Page**
   - Institution header
   - Report title
   - Academic year and session
   - Average FFI and response rates

2. **Data Table** (11 columns)
   - S.No
   - Faculty Name
   - Subject Code / Batch
   - Course Name
   - Semester
   - FFI Score (color-coded)
   - Response %
   - Needs Attention
   - Appreciation
   - Action Taken
   - Faculty Signature

3. **Signature Section**
   - HOD signature
   - PRO-VC signature
   - Auto-embedded from database

4. **Appended PDFs**
   - Original feedback PDFs from Google Drive
   - Stamped with HOD + VC signatures

---

## ≡ƒöÉ AUTHENTICATION & ROLES

### Roles:
- `admin` - Full system access
- `vc` - Approve submissions
- `hod` - Manage department feedback
- `faculty` - View own feedback

### Multi-Role Support:
- Users can have multiple roles
- Workspace switching (HOD workspace vs Faculty workspace)
- Self-approval conflict detection

### Middleware:
```javascript
authMiddleware                  // Verify JWT token
requireAnyRole('hod', 'admin')  // Check role
requireWorkspace('hod')         // Check active workspace
```

---

## ≡ƒÜ¿ ERROR HANDLING

### Common Issues:

1. **Google Drive Rate Limit (429)**
   - System retries 4 times with exponential backoff
   - 5s, 10s, 20s delays between attempts

2. **Self-Approval Conflict**
   - HOD is also the evaluated faculty
   - System auto-resolves using ApprovalPolicy
   - Routes to alternate approver or escalates to admin

3. **PDF Not Found**
   - Checks cloud storage first
   - Falls back to local storage
   - Returns helpful error message

4. **AI Analysis Failure**
   - Caches successful results
   - Falls back to metadata extraction
   - Continues processing without AI data

---

## ΓÜÖ∩╕Å CONFIGURATION

### File Size Limits:
```javascript
CSV/Excel:    20 MB
Single PDF:   20 MB
Batch Upload: 500 MB (max 500 files)
```

### Timeouts:
```javascript
PDF Download:      30 seconds
Processing:        120 seconds (2 minutes)
Batch Upload:      600 seconds (10 minutes)
PDF Generation:    120 seconds
```

### Concurrency:
```javascript
Parallel PDF downloads:  3
Processing limit:        5
```

---

## ≡ƒöº SETUP INSTRUCTIONS

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Create .env file
MONGODB_URI=mongodb://localhost:27017/feedback
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_google_api_key
PORT=5000
```

### 3. Start Server
```bash
npm start
# or for development
npm run dev
```

### 4. Access API
```
http://localhost:5000/api/
```

---

## ≡ƒô¥ TESTING

### Test CSV Parser
```bash
curl -X POST http://localhost:5000/api/debug/parse-excel \
  -F "file=@feedback.xlsx"
```

### Test AI Connection
```bash
curl http://localhost:5000/api/reports/ai/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Health Check
```bash
curl http://localhost:5000/api/health
```

---

## ≡ƒôÜ COMMON TASKS

### Add New Report Manually
```javascript
POST /api/process/process-one
{
  "pdfLink": "https://drive.google.com/file/d/...",
  "responseCount": 45,
  "responsePercent": 85.5
}
```

### Update Report
```javascript
PATCH /api/reports/:id/edit
{
  "actionTaken": "Will add more examples",
  "hodRemarks": "Good performance overall",
  "status": "faculty_approved"
}
```

### Export Reports as CSV
```javascript
GET /api/reports/my/export
```

### Generate Preview PDF
```javascript
GET /api/reports/my/preview-pdf
```

---

## ≡ƒÉ¢ DEBUGGING TIPS

### Enable Verbose Logging
```javascript
// In any route file
console.log('[DEBUG]', variable);
```

### Check Database
```javascript
// MongoDB Shell
db.facultyreports.find({ hodId: ObjectId("...") })
db.submissions.find({ status: "submitted" })
```

### Check Cache
```javascript
// cache.js
getCached('pdf_https://...')
```

### View Logs
```javascript
// AuditLog
db.auditlogs.find({ actorId: ObjectId("...") }).sort({ createdAt: -1 })
```

---

## ≡ƒô₧ SUPPORT & RESOURCES

### Documentation Files:
1. `PDF_EXTRACTION_AND_REPORT_FLOW.md` - System overview
2. `TECHNICAL_REFERENCE_COMPLETE.md` - All APIs and models
3. `COMPLETE_CODE_REFERENCE.md` - Complete source code
4. This file - Quick reference

### Key Concepts:
- **FFI Score**: Faculty Feedback Index (1-5 scale)
- **Workspace**: Role context (HOD/Faculty/VC)
- **Self-Approval**: HOD reviewing their own feedback
- **Alternate Approver**: Substitute approver for conflicts

---

## ≡ƒÄ» SUCCESS CRITERIA

### For HOD:
- Γ£à Upload Excel with 100+ links
- Γ£à AI processes within 5 minutes
- Γ£à Edit and customize reports
- Γ£à Send to faculty successfully
- Γ£à Submit to VC without conflicts
- Γ£à Generate final PDF with signatures

### For System:
- Γ£à 95%+ PDF extraction success rate
- Γ£à Zero data loss during processing
- Γ£à Proper conflict detection
- Γ£à PDF generation under 60 seconds
- Γ£à All signatures embedded correctly

---

This quick reference provides everything you need to understand and work with the PDF extraction system!
