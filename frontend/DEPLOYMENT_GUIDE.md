# ≡ƒÜÇ Deployment Guide - Faculty Feedback System

This guide will help you deploy the Faculty Feedback System to Render (Backend) and Vercel (Frontend).

---

## ≡ƒôª **Backend Deployment on Render**

### **Step 1: Create Render Account**
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### **Step 2: Deploy Backend**
1. Click **"New +"** ΓåÆ **"Web Service"**
2. Connect your GitHub repository: `ajayFeedback_Backend`
3. Configure the service:
   - **Name**: `faculty-feedback-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `master`
   - **Root Directory**: Leave empty
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### **Step 3: Add Environment Variables**
Click **"Advanced"** and add these environment variables:

#### Required:
```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_min_32_chars
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=https://your-app.vercel.app
```

#### Optional (for full features):
```
GEMINI_API_KEY=your_gemini_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
GOOGLE_DRIVE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### **How to get these values:**

**MONGODB_URI:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster ΓåÆ Get connection string
3. Replace `<password>` with your password
4. Format: `mongodb+srv://username:password@cluster.mongodb.net/faculty-feedback`

**JWT_SECRET:**
- Generate a random 32+ character string
- Example: `openssl rand -base64 32` or use https://randomkeygen.com

**GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET:**
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-backend.onrender.com/api/auth/google/callback`
   - `http://localhost:5000/api/auth/google/callback`

**GEMINI_API_KEY** (for AI features):
1. Go to https://makersuite.google.com/app/apikey
2. Create API key

**EMAIL (for notifications):**
1. Use Gmail account
2. Enable 2-Step Verification
3. Generate App Password: https://myaccount.google.com/apppasswords

**GOOGLE_DRIVE_PRIVATE_KEY** (for Drive integration):
1. Go to https://console.cloud.google.com
2. Enable Google Drive API
3. Create Service Account
4. Generate JSON key
5. Copy the entire `private_key` value (including `\n`)

### **Step 4: Deploy**
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for first deployment
3. Copy your backend URL: `https://your-app.onrender.com`

---

## ≡ƒîÉ **Frontend Deployment on Vercel**

### **Step 1: Create Vercel Account**
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### **Step 2: Deploy Frontend**
1. Click **"Add New..."** ΓåÆ **"Project"**
2. Import your repository: `ajayFeedback_Frontent`
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### **Step 3: Add Environment Variables**
Click **"Environment Variables"** and add:

```
VITE_API_URL=https://your-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=same_as_backend_google_client_id
```

**Important:** 
- Use the Render backend URL from Step 4 above
- Use the same Google Client ID as backend

### **Step 4: Deploy**
1. Click **"Deploy"**
2. Wait 2-3 minutes for deployment
3. Your app will be live at: `https://your-app.vercel.app`

### **Step 5: Update Google OAuth**
1. Go back to Google Cloud Console
2. Add Vercel URL to authorized origins:
   - `https://your-app.vercel.app`
3. Add to authorized redirect URIs:
   - `https://your-app.vercel.app/login`

---

## ≡ƒöä **Auto-Deployment Setup**

### **Backend (Render):**
Γ£à **Already configured!** Every push to `master` branch will auto-deploy.

### **Frontend (Vercel):**
Γ£à **Already configured!** Every push to `master` branch will auto-deploy.

**How it works:**
1. You push code to GitHub
2. Render/Vercel detects the change
3. Automatically builds and deploys
4. Live in 2-5 minutes!

---

## ≡ƒº¬ **Testing Your Deployment**

### **Backend Health Check:**
```bash
curl https://your-backend.onrender.com/api/auth/me
```
Should return: `{"error": "No token"}` (means it's working!)

### **Frontend Check:**
1. Visit: `https://your-app.vercel.app`
2. Should see Landing page
3. Try Google Sign-In

---

## ≡ƒÉ¢ **Troubleshooting**

### **Backend Issues:**

**Problem:** "Application failed to respond"
- Check Render logs: Dashboard ΓåÆ Logs
- Verify all environment variables are set
- Check MongoDB connection string

**Problem:** "Google Sign-In not working"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check authorized redirect URIs in Google Console

**Problem:** "CORS errors"
- Add frontend URL to `FRONTEND_URL` env variable
- Format: `https://your-app.vercel.app` (no trailing slash)

### **Frontend Issues:**

**Problem:** "Failed to fetch from API"
- Verify `VITE_API_URL` points to correct Render URL
- Check backend is deployed and running

**Problem:** "Google Sign-In button not showing"
- Verify `VITE_GOOGLE_CLIENT_ID` is set
- Check browser console for errors

**Problem:** "Build failed"
- Check Vercel build logs
- Verify all dependencies in package.json

---

## ≡ƒôè **Monitoring**

### **Render Dashboard:**
- View logs in real-time
- Monitor CPU/Memory usage
- Check deployment history

### **Vercel Dashboard:**
- View deployment logs
- Monitor build times
- Check traffic analytics

---

## ≡ƒöÉ **Security Checklist**

- [ ] All environment variables set
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] MongoDB has IP whitelist or allows all (0.0.0.0/0)
- [ ] Google OAuth URLs are correct
- [ ] Frontend CORS is configured
- [ ] `.env` files are in `.gitignore`

---

## ≡ƒô¥ **Post-Deployment Steps**

1. **Test all features:**
   - Google Sign-In
   - HOD Dashboard
   - Pro-VC Dashboard
   - PDF Upload
   - Report Generation

2. **Update DNS (Optional):**
   - Point custom domain to Vercel
   - Update all OAuth redirect URLs

3. **Monitor first week:**
   - Check Render logs daily
   - Watch for errors in Vercel
   - Monitor MongoDB usage

---

## ≡ƒÆ░ **Costs**

**Free Tier Limits:**

**Render:**
- Γ£à Free for 1 web service
- ΓÜá∩╕Å Sleeps after 15 min inactivity
- ΓÜá∩╕Å 750 hours/month
- ΓÜá∩╕Å Limited bandwidth

**Vercel:**
- Γ£à Free for hobby projects
- Γ£à Unlimited deployments
- Γ£à 100 GB bandwidth/month
- Γ£à Instant wake-up (no sleep)

**MongoDB Atlas:**
- Γ£à Free tier: 512 MB storage
- Γ£à Shared cluster
- Γ£à Enough for development

**Upgrade when:**
- Backend needs to stay awake 24/7 ΓåÆ Render Starter ($7/mo)
- Need more bandwidth ΓåÆ Vercel Pro ($20/mo)
- Need more DB storage ΓåÆ MongoDB M10 ($57/mo)

---

## ≡ƒÄë **Success!**

Your Faculty Feedback System is now live!

**Access URLs:**
- Frontend: https://your-app.vercel.app
- Backend API: https://your-backend.onrender.com
- GitHub Frontend: https://github.com/ramsevakmeena93-hub/ajayFeedback_Frontent
- GitHub Backend: https://github.com/ramsevakmeena93-hub/ajayFeedback_Backend

**Next Steps:**
1. Share the link with users
2. Create first HOD account (25mc1sh132@mitsgwl.ac.in)
3. Test complete workflow
4. Monitor deployment logs

---

## ≡ƒô₧ **Support**

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Docs: https://docs.mongodb.com

---

**Last Updated:** January 2025
**Version:** 1.0.0
