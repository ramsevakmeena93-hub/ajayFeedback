# ≡ƒÄ» VC Test Account Setup Guide

## Γ£à **Status: HOD Account Created**

I've created the HOD account for you:

```
Email: 25mc1sh132@mitsgwl.ac.in
Password: shivam123
Name: Shivam Singh Rajput
Role: HOD
Department: Humanities
```

---

## ≡ƒôï **Step-by-Step Instructions:**

### **Step 1: Login as HOD** Γ£à READY

1. Open your frontend app
2. Click "Login"
3. Enter:
   - Email: `25mc1sh132@mitsgwl.ac.in`
   - Password: `shivam123`
4. You should see HOD Dashboard

---

### **Step 2: Upload Excel File** ΓÅ│ YOU NEED TO DO THIS

1. Go to HOD Dashboard
2. Click "Upload Excel" or "Process Feedback"
3. Select your Excel file with faculty feedback data
4. Wait for processing to complete
5. You should see reports appear

**Γ¥ù IMPORTANT:** Without this step, there are NO reports to show to VC!

---

### **Step 3: Create VC Account & Submit Reports** ΓÅ│ RUN SCRIPT AFTER STEP 2

After you've uploaded Excel, run this command:

```bash
cd backend
node create_vc_test_account.js
```

This will:
- Γ£à Create VC test account
- Γ£à Update all reports to `faculty_approved` status
- Γ£à Create a submission from HOD to VC
- Γ£à Show you the VC login credentials

---

### **Step 4: Login as VC** ΓÅ│ AFTER STEP 3

The script will give you VC credentials like:

```
Email: vc.test@mitsgwl.ac.in
Password: vc123456
```

Login with these and you'll see all HOD's reports!

---

## ≡ƒöä **Current Status:**

| Step | Status | Action Needed |
|------|--------|---------------|
| 1. HOD Account | Γ£à Created | Login with credentials above |
| 2. Upload Excel | ΓÅ│ Pending | YOU need to do this |
| 3. VC Account | ΓÅ│ Waiting | Run script after Step 2 |
| 4. VC Login | ΓÅ│ Waiting | Use credentials from Step 3 |

---

## ≡ƒùé∩╕Å **Files Created:**

### **1. `backend/create_vc_test_account.js`**
Automated script that:
- Finds HOD by email
- Gets all HOD's reports
- Creates VC account
- Updates report statuses
- Creates submission from HOD to VC

### **2. `backend/find_hods_and_reports.js`**
Diagnostic script that shows:
- All HOD accounts in database
- Report count for each HOD
- Orphan reports (without HOD)
- Database statistics

---

## ≡ƒÜ¿ **Troubleshooting:**

### **"No reports found"**
ΓåÆ You haven't uploaded Excel file yet (Step 2)

### **"HOD not found"**
ΓåÆ Login once as HOD first, then run script

### **"VC already exists"**
ΓåÆ That's OK! Script will update the account

### **"Connection refused"**
ΓåÆ Check your MongoDB connection in `.env` file

---

## ≡ƒô¥ **What Happens Next:**

### **After Upload (Step 2):**
Your database will have:
```
Users:
  - Shivam Singh Rajput (HOD)
  
Reports:
  - Report 1: Faculty A - Subject X (processed)
  - Report 2: Faculty B - Subject Y (processed)
  - Report 3: Faculty C - Subject Z (processed)
  - ... (all from Excel file)
```

### **After Script (Step 3):**
Your database will have:
```
Users:
  - Shivam Singh Rajput (HOD)
  - Dr. Pro Vice-Chancellor (VC) ΓåÉ NEW!
  
Reports:
  - All reports updated to "faculty_approved"
  
Submissions:
  - Submission 1:
      HOD: Shivam Singh Rajput
      Reports: [all HOD reports]
      Status: submitted
      Sent to: VC
```

### **After VC Login (Step 4):**
VC will see:
```
VC Dashboard:
  - 1 submission from "Shivam Singh Rajput"
  - X reports inside
  - Can approve/reject/send back
```

---

## ≡ƒÄ» **Quick Start Commands:**

```bash
# Step 1: Check current status
cd backend
node find_hods_and_reports.js

# Step 2: Login as HOD and upload Excel (use frontend)
# Email: 25mc1sh132@mitsgwl.ac.in
# Password: shivam123

# Step 3: After upload, create VC & submission
node create_vc_test_account.js

# Step 4: Login as VC (use frontend)
# Email: vc.test@mitsgwl.ac.in
# Password: vc123456
```

---

## Γ£¿ **Why This Approach:**

1. **Real workflow** - Matches actual HOD ΓåÆ VC flow
2. **Data integrity** - Uses real uploaded reports
3. **Easy testing** - Pre-configured accounts
4. **Reproducible** - Can run script multiple times
5. **Safe** - Doesn't modify existing data

---

## ≡ƒô₧ **Need Help?**

If you get stuck:

1. Check database status:
   ```bash
   node find_hods_and_reports.js
   ```

2. Check Render logs for backend errors

3. Check browser console (F12) for frontend errors

4. Verify `.env` file has correct `MONGO_URI`

---

## ≡ƒÄë **Summary:**

1. Γ£à **HOD account created** - Login and upload Excel
2. ΓÅ│ **You upload Excel** - This creates reports
3. ΓÅ│ **Run script** - This creates VC and submission
4. ΓÅ│ **Login as VC** - See all reports!

**Start with Step 1 now!** ≡ƒÜÇ
