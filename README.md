# 🏛️ College Digital Visitor Management System

A modern, responsive, collegiate-grade **Digital Visitor Management System** built with HTML5, CSS3, JavaScript, and powered by **Google Firebase (Firebase Authentication & Cloud Firestore)** as the serverless backend.

---

## 📁 Project Structure

```
c:/Digital visitor management system/
├── backend/
│   ├── firebase-config.js      # Backend Firebase config template
│   ├── auth.js                 # Authentication service module
│   ├── visitor-service.js      # Cloud Firestore visitor CRUD module
│   ├── firestore.rules         # Cloud Firestore security rules
│   └── README.md               # Detailed backend architecture documentation
├── frontend/
│   ├── index.html              # 1. Homepage (Landing page with portal entry)
│   ├── login.html              # 2. Login Page (Firebase Auth & Demo Quick-access)
│   ├── dashboard.html          # 3. Campus Dashboard (Live Firestore KPI stats & charts)
│   ├── register.html           # 4. Visitor Registration Form (Firestore pass issuer)
│   ├── visitors.html           # 5. Visitor Records (Live search, multi-filters, CSV export)
│   ├── visitor-details.html    # 6. Visitor Profile (Audit timeline & exit toggle)
│   ├── entry-exit.html         # 7. Gate Entry / Exit Console (Quick scanner & switcher)
│   ├── visitor-pass.html       # 8. Digital Visitor Pass (Printable ID badge & dynamic QR)
│   ├── notifications.html      # 9. Campus Alerts & Dispatches (Real-time feed)
│   ├── history.html            # 10. Visitor History Archive (Search & CSV export)
│   ├── profile.html            # 11. Security Officer Profile & Settings
│   ├── css/
│   │   └── style.css           # Complete collegiate design system & print styling
│   ├── js/
│   │   ├── firebase-config.js  # Client Firebase App, Auth & Firestore initializer
│   │   ├── auth.js             # Client Authentication & Route Guards
│   │   ├── visitor-service.js  # Cloud Firestore direct client service
│   │   ├── data.js             # Unified DataStore layer & QR generator
│   │   ├── validation.js       # Client-side form validation feedback
│   │   ├── app.js              # Navigation, clock, drawer, modals & toasts
│   │   └── visitors.js         # View controllers for all frontend pages
│   └── assets/
│       └── logo.svg            # College emblem / crest vector
├── firestore.rules             # Production Cloud Firestore Security Rules
├── package.json                # npm package configuration
├── open-app.bat                # Windows 1-click launcher
├── serve.ps1                   # Built-in PowerShell HTTP server
└── README.md                   # Main project documentation
```

---

## 🔥 Firebase Setup Guide (Step-by-Step)

Follow these simple steps to connect your Firebase project:

### Step 1: Create a Firebase Project
1. Visit the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** (or "Create a project").
3. Name your project (e.g. `college-visitor-management`).
4. Disable Google Analytics (optional for college projects) and click **"Create project"**.

### Step 2: Register Web Application
1. In your Firebase Project Overview page, click the **Web icon `</>`** to add an app.
2. Enter an App nickname (e.g. `College-VMS-Web`).
3. Click **"Register app"**.
4. Firebase will display your `firebaseConfig` credentials object containing:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Step 3: Enable Firebase Authentication
1. In the left navigation menu, click **Build** -> **Authentication**.
2. Click **"Get started"**.
3. Under the **Sign-in method** tab, select **Email/Password**.
4. Toggle **Enable** to ON and click **Save**.
5. *(Optional)* Under the **Users** tab, you can click **"Add user"** and create:
   - Email: `admin@college.edu`
   - Password: `admin123`

### Step 4: Enable Cloud Firestore Database
1. In the left navigation menu, click **Build** -> **Firestore Database**.
2. Click **"Create database"**.
3. Choose your database location (e.g. `asia-south1` or closest to you).
4. Select **"Start in test mode"** (or production mode) and click **Enable**.

### Step 5: Configure Security Rules
1. Go to the **Firestore Database** -> **Rules** tab.
2. Paste the contents of [`firestore.rules`](file:///c:/Digital%20visitor%20management%20system/firestore.rules):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    match /visitors/{visitorId} {
      allow read, write: if isAuthenticated();
    }
    match /notifications/{notificationId} {
      allow read, write: if isAuthenticated();
    }
    match /users/{userId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```
3. Click **Publish**.

### Step 6: Paste Firebase Configuration into the Code
Open [`frontend/js/firebase-config.js`](file:///c:/Digital%20visitor%20management%20system/frontend/js/firebase-config.js) and replace the placeholder values:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "college-vms.firebaseapp.com",
  projectId: "college-vms",
  storageBucket: "college-vms.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
```

---

## 🚀 How to Run the Application

### Option 1: Run via npm (Recommended)
```bash
npm run dev
```
*(Starts a local web server at `http://localhost:3000`)*

### Option 2: 1-Click Launch (No Node.js Required)
- Double-click **`open-app.bat`** in the project folder, OR
- Right-click **`serve.ps1`** and select **"Run with PowerShell"**.

---

## 🧪 Testing the Complete Workflow (Viva Walkthrough)

### 1. Authentication (`login.html`)
- Open the application.
- Click **"Admin Demo"** or enter `admin@college.edu` and `admin123`.
- Click **"Sign In to Campus Portal"**.
- Try entering invalid credentials to verify error message feedback.

### 2. Dashboard (`dashboard.html`)
- Observe real-time KPI metrics calculated live from Firestore:
  - **Total Visitors**
  - **Currently Inside Campus**
  - **Today's Visitors**
  - **Completed Visits**
- View the recent visitor log and department distribution graph.

### 3. Visitor Registration (`register.html`)
- Click **"Register New Visitor"** from the sidebar or dashboard.
- Click **"⚡ Fill Sample Data"** to auto-populate the form.
- Click **"🎫 Register & Issue Digital Pass"**.
- A new document is written to Firestore `visitors` collection with an assigned ID (e.g. `VIS-2026-010`).
- An automated notification is logged into the `notifications` collection.

### 4. Gate Entry / Exit Console (`entry-exit.html`)
- Navigate to **"Entry / Exit Gate"**.
- Under **Currently Inside Campus**, click **"Mark Exit 🚪"** on any visitor.
- Status is immediately updated to `"Exited"` in Firestore with exit timestamp.
- Under **Exited / Departed**, click **"Re-Entry ↩️"** to mark a visitor back inside campus.

### 5. Digital Visitor Pass (`visitor-pass.html`)
- Click **"🎫 Pass"** from any table row or success modal.
- View the official ID card with candidate details and dynamic SVG QR code.
- Click **"🖨️ Print Visitor Pass"** to test clean print styles.

### 6. Visitor Records & History (`visitors.html` & `history.html`)
- Search by name, phone, host, or ID.
- Filter by department, status, and date.
- Click **"📥 Export CSV"** to download an audit spreadsheet.

### 7. Notifications Feed (`notifications.html`)
- Check arrival notices and host dispatches.
- Mark individual notifications as read or clear the feed.

### 8. Security Officer Profile (`profile.html`)
- Edit officer details, assigned station, and shift.
- Click **"Save Profile to Firestore"** to synchronize.
