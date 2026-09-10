# Digital Visitor Management System for College

A modern, responsive, pure frontend web application designed for managing campus visitors at a college or university.

## Project Structure

```
c:/Digital visitor management system/
├── frontend/
│   ├── index.html              # 1. Homepage (Clean, responsive landing page with direct login)
│   ├── login.html              # 2. Login Page (Collegiate portal & mock authentication)
│   ├── dashboard.html          # 2. Admin Dashboard (Live KPI stats, recent activity, dept charts)
│   ├── register.html           # 3. Visitor Registration Form (Client validation & pass issuer)
│   ├── visitor-pass.html       # 4. Digital Visitor Pass (Printable ID badge & dynamic QR code)
│   ├── visitors.html           # 5. Visitor Records (Live search, multi-filters, CSV export)
│   ├── visitor-details.html    # 6. Visitor Record Profile (Full credentials & visit timeline)
│   ├── entry-exit.html         # 7. Gate Entry / Exit Console (Quick scan & in/out switcher)
│   ├── notifications.html      # 8. Notifications Feed (Arrival alerts & security notices)
│   ├── history.html            # 9. Visitor History Archive (Past records & duration metrics)
│   ├── profile.html            # 10. Profile & Settings (Station settings & demo seed reset)
│   ├── css/
│   │   └── style.css           # Complete modern collegiate design system & print styles
│   ├── js/
│   │   ├── app.js              # Global navigation, drawer, clock, toasts & modals
│   │   ├── data.js             # LocalStorage mock repository, sample data & QR generator
│   │   ├── validation.js       # Client-side form validators & error feedback
│   │   └── visitors.js         # Business logic controller for all views
│   └── assets/
│       └── logo.svg            # College crest / emblem graphic
├── package.json                # npm configuration with dev server scripts
├── open-app.bat                # Windows 1-click launcher
└── README.md
```

## How to Run

### Option 1: Direct 1-Click Launch (Recommended - No Node.js required)
- Double-click **`open-app.bat`** in the root folder, OR
- Open the `frontend/` folder and double-click **`index.html`** in any web browser (Chrome, Edge, Firefox).

### Option 2: Run via npm (If Node.js is installed)
```bash
npm run dev
```
*(This starts a local development server at `http://localhost:3000` serving the `frontend/` directory).*

## Demo Credentials
On the Login Page, click **"Admin Demo"** or **"Gate Officer"** to auto-fill credentials, then click **"Sign In to Campus Portal"**.
