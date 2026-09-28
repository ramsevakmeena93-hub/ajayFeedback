# ≡ƒöÉ Google OAuth Implementation Guide

## ≡ƒôï **Overview**

Your MITS Feedback System uses **Google OAuth 2.0** for secure authentication. Users log in with their Google Workspace accounts.

---

## ≡ƒÄ» **How It Works**

```
User ΓåÆ Google Login Button ΓåÆ Google ΓåÆ Your Backend ΓåÆ JWT Token ΓåÆ Dashboard
```

### **Step-by-Step Flow:**

1. **User clicks "Sign in with Google"**
2. **Google popup appears** - User selects Google account
3. **Google returns credential** - JWT token from Google
4. **Frontend sends to backend** - POST `/api/auth/google`
5. **Backend verifies token** - Using Google OAuth2Client
6. **Backend checks email** - Domain restriction (@mitsgwl.ac.in)
7. **Backend finds/creates user** - In MongoDB
8. **Backend returns JWT** - Your own JWT token
9. **Frontend stores token** - localStorage
10. **User redirected** - To role-based dashboard

---

## ≡ƒöº **Frontend Implementation**

### **File: `src/pages/Login.jsx`**

#### **1. Google Identity Services Script**

Add to `index.html`:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

#### **2. Initialize Google**

```javascript
useEffect(() => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: handleGoogleSuccess,  // Your callback function
    auto_select: false,
  });

  // Render the button
  window.google.accounts.id.renderButton(
    document.getElementById("google-login-btn"),
    {
      theme: "filled_blue",
      size: "large",
      type: "standard",
      text: "signin_with",
      shape: "pill",
      width: 340,
    }
  );
}, []);
```

#### **3. Handle Google Response**

```javascript
async function handleGoogleSuccess(response) {
  if (!response?.credential) return;
  
  try {
    // Send Google credential to your backend
    const { data } = await axios.post("/api/auth/google", {
      credential: response.credential,  // Google JWT token
    });
    
    // Save user data and your JWT token
    login(data.user, data.token);
    
    // Redirect to dashboard
    navigate(`/${data.user.role}`);
    
  } catch (err) {
    toast.error(err.response?.data?.error || "Sign-in failed");
  }
}
```

---

## ≡ƒûÑ∩╕Å **Backend Implementation**

### **File: `backend/routes/auth.js`**

#### **1. Install Dependencies**

```bash
npm install google-auth-library
```

#### **2. Environment Variables**

Add to `.env`:
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
JWT_SECRET=your-jwt-secret-key
```

#### **3. Google OAuth Route**

```javascript
const { OAuth2Client } = require('google-auth-library');

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü
    // STEP 1: Verify Google Token
    // ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü
    
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const googlePayload = ticket.getPayload();
    
    // ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü
    // STEP 2: Extract User Info
    // ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü
    
    const {
      email,
      name,
      picture,
      email_verified,
      sub  // Google User ID
    } = googlePayload;
    
    if (!email_verified) {
      return res.status(403).json({
        error: 'Email not verified by Google'
      });
    }
    
    // ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü
    // STEP 3: Domain Restriction
    // ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü
    
    const allowedDomains = [
      '@mitsgwl.ac.in',
      '@mitsgwalior.in'
    ];
    
    const isAllowed = allowedDomains.some(
      domain => email.toLowerCase().endsWith(domain)
    );
    
    if (!isAllowed) {
      return res.status(403).json({
        error: 'Only MITS email addresses allowed'
      });
    }
    
    // ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü
    // STEP 4: Find or Create User
    // ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü
    
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Create new user
      const randomPassword = await bcrypt.hash(
        Math.random().toString(36),
        10
      );
      
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: randomPassword,
        role: 'faculty',  // Default role
        profilePhoto: picture || '',
        googleId: sub,
        googleVerified: true,
      });
    } else {
      // Update existing user
      user.googleId = sub;
      user.googleVerified = true;
      user.lastLogin = new Date();
      user.profilePhoto = picture || user.profilePhoto;
      await user.save();
    }
    
    // ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü
    // STEP 5: Generate Your JWT Token
    // ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü
    
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department || ''
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü
    // STEP 6: Return User + Token
    // ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || '',
        profilePhoto: user.profilePhoto || '',
      }
    });
    
  } catch (err) {
    console.error('[Auth] Google OAuth error:', err.message);
    res.status(401).json({
      error: 'Invalid or expired Google token'
    });
  }
});
```

---

## ≡ƒöæ **Get Google Client ID**

### **Step 1: Go to Google Cloud Console**

https://console.cloud.google.com

### **Step 2: Create Project**

1. Click "Select a project" ΓåÆ "New Project"
2. Name: "MITS Feedback System"
3. Click "Create"

### **Step 3: Enable Google+ API**

1. Go to "APIs & Services" ΓåÆ "Library"
2. Search for "Google+ API"
3. Click "Enable"

### **Step 4: Create OAuth Credentials**

1. Go to "APIs & Services" ΓåÆ "Credentials"
2. Click "Create Credentials" ΓåÆ "OAuth client ID"
3. Application type: "Web application"
4. Name: "MITS Feedback Web"
5. Authorized JavaScript origins:
   ```
   http://localhost:5173
   https://your-frontend-domain.vercel.app
   ```
6. Authorized redirect URIs:
   ```
   http://localhost:5173
   https://your-frontend-domain.vercel.app
   ```
7. Click "Create"
8. Copy **Client ID**

### **Step 5: Configure OAuth Consent Screen**

1. Go to "OAuth consent screen"
2. User Type: "Internal" (for Google Workspace) or "External"
3. App name: "MITS Feedback System"
4. User support email: your-email@mitsgwl.ac.in
5. Add scopes:
   - email
   - profile
   - openid
6. Test users (if External): Add your test emails
7. Click "Save and Continue"

---

## ΓÜÖ∩╕Å **Environment Setup**

### **Frontend (.env)**

```env
VITE_GOOGLE_CLIENT_ID=32902780570-ltgii8ds5cf6pp8elj3uapsao7a78u88.apps.googleusercontent.com
VITE_API_URL=https://your-backend.onrender.com
```

### **Backend (.env)**

```env
GOOGLE_CLIENT_ID=32902780570-ltgii8ds5cf6pp8elj3uapsao7a78u88.apps.googleusercontent.com
JWT_SECRET=your-super-secret-jwt-key-change-this
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mits-feedback
```

---

## ≡ƒöÆ **Security Features**

### **1. Domain Restriction**

```javascript
const ALLOWED_DOMAINS = [
  '@mitsgwl.ac.in',
  '@mitsgwalior.in'
];

function isAllowedDomain(email) {
  return ALLOWED_DOMAINS.some(domain =>
    email.toLowerCase().endsWith(domain)
  );
}
```

Only MITS email addresses can log in!

### **2. Token Verification**

Google's OAuth2Client verifies:
- Γ£à Token signature (not tampered)
- Γ£à Token expiry (not expired)
- Γ£à Audience (for your app only)
- Γ£à Issuer (from Google)

### **3. JWT Token**

Your backend generates its own JWT:
- Γ£à Includes user ID, role, email
- Γ£à Expires in 7 days
- Γ£à Signed with secret key
- Γ£à Verified on every API request

---

## ≡ƒº¬ **Testing**

### **Test with Real Google Account**

1. **Start frontend:**
   ```bash
   npm run dev
   ```

2. **Start backend:**
   ```bash
   cd backend
   npm start
   ```

3. **Open browser:**
   ```
   http://localhost:5173/login
   ```

4. **Click "Sign in with Google"**

5. **Select Google account**
   - Must be @mitsgwl.ac.in or @mitsgwalior.in

6. **Should redirect to dashboard**

---

## ≡ƒÉ¢ **Troubleshooting**

### **Error: "Invalid client_id"**

ΓåÆ Check `VITE_GOOGLE_CLIENT_ID` in frontend `.env`  
ΓåÆ Make sure it matches Google Cloud Console

### **Error: "redirect_uri_mismatch"**

ΓåÆ Add your URL to Google Console:
  - Authorized JavaScript origins
  - Authorized redirect URIs

### **Error: "Only MITS email addresses allowed"**

ΓåÆ Your email doesn't end with @mitsgwl.ac.in  
ΓåÆ Update `ALLOWED_DOMAINS` in `backend/routes/auth.js`

### **Error: "Invalid or expired Google token"**

ΓåÆ Google token verification failed  
ΓåÆ Check `GOOGLE_CLIENT_ID` in backend `.env`  
ΓåÆ Make sure `google-auth-library` is installed

### **Button doesn't appear**

ΓåÆ Google script not loaded  
ΓåÆ Check browser console for errors  
ΓåÆ Make sure this is in `index.html`:
  ```html
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  ```

---

## ≡ƒôè **What Gets Stored**

### **In MongoDB (User collection):**

```javascript
{
  _id: "507f1f77bcf86cd799439011",
  name: "Shivam Singh Rajput",
  email: "25mc1sh132@mitsgwl.ac.in",
  password: "$2a$10$hashed...",  // Random, not used
  role: "hod",
  department: "Humanities",
  googleId: "115367890123456789012",  // Google sub
  googleVerified: true,
  profilePhoto: "https://lh3.googleusercontent.com/...",
  lastLogin: "2025-01-10T12:34:56.789Z",
  createdAt: "2025-01-01T00:00:00.000Z"
}
```

### **In localStorage (Frontend):**

```javascript
{
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: {
    id: "507f1f77bcf86cd799439011",
    name: "Shivam Singh Rajput",
    email: "25mc1sh132@mitsgwl.ac.in",
    role: "hod",
    department: "Humanities",
    profilePhoto: "https://lh3.googleusercontent.com/..."
  }
}
```

---

## ≡ƒöä **Role Assignment Logic**

```javascript
// In backend/routes/auth.js

let assignedRole = 'faculty';  // Default

// Designated HOD
if (cleanEmail === '25mc1sh132@mitsgwl.ac.in') {
  assignedRole = 'hod';
  assignedDepartment = 'Humanities';
}

// Designated Admin
if (cleanEmail === '25tc1aj7@mitsgwl.ac.in') {
  assignedRole = 'admin';
}

// You can add more designated accounts:
if (cleanEmail === 'vc@mitsgwl.ac.in') {
  assignedRole = 'vc';
}
```

---

## Γ£à **Summary**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Google Identity Services | Render Google button |
| **Google** | OAuth 2.0 | Authenticate user |
| **Backend** | google-auth-library | Verify Google token |
| **Backend** | JWT | Generate your own token |
| **Database** | MongoDB | Store user data |

**Flow:** User ΓåÆ Google Button ΓåÆ Google Popup ΓåÆ Google Token ΓåÆ Your Backend ΓåÆ Verify ΓåÆ Create/Find User ΓåÆ Your JWT ΓåÆ Frontend ΓåÆ Dashboard

**Security:** Domain restriction + Token verification + JWT expiry + HTTPS only

**Your implementation is ALREADY complete and working!** ≡ƒÄë
