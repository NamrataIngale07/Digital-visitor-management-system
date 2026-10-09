# Backend Architecture & Firebase Integration Guide

This document describes the Backend Architecture, Cloud Firestore Data Models, Firebase Authentication integration, and Security Rules for the **College Digital Visitor Management System**.

---

## 1. Architecture Overview

```
[ Frontend Client (HTML5 / Vanilla JS / CSS3) ]
                     │
                     ▼
[ Firebase Web SDK v10 (Compat / Modular CDN) ]
       │                                │
       ▼                                ▼
[ Firebase Authentication ]     [ Cloud Firestore Database ]
  • Email/Password Login          • visitors collection
  • Session state & guards        • notifications collection
  • Admin & Gate Officer roles    • users collection
```

- **Zero Traditional Express Server Required**: Cloud Firestore serves as the fully managed serverless backend database with real-time sync, offline persistence, and low-latency queries.
- **Client Security**: Enforced via Firestore Security Rules (`firestore.rules`) ensuring unauthenticated users cannot modify or tamper with campus visitor records.

---

## 2. Cloud Firestore Database Collections & Schema

### Collection: `visitors`
Stores campus visitor passes, personal details, host faculty, timestamps, and gate statuses.

| Field Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique campus visitor pass identifier | `"VIS-2026-001"` |
| `name` | `string` | Full name of the visitor | `"Dr. Rajesh Kumar"` |
| `phone` | `string` | 10-digit mobile contact number | `"9876543210"` |
| `email` | `string` | Visitor email (optional) | `"rajesh.kumar@techresearch.org"` |
| `idType` | `string` | Government ID proof type | `"Aadhaar / National ID"` |
| `idNumber` | `string` | Photo ID document number | `"8942-5120-3341"` |
| `purpose` | `string` | Verified purpose of visit | `"Guest Lecture / AI Workshop"` |
| `department` | `string` | College department / faculty visited | `"Computer Science & Engineering"` |
| `hostName` | `string` | Faculty or staff host to meet | `"Prof. Suresh Sharma (HOD)"` |
| `date` | `string` | Date of visit (YYYY-MM-DD) | `"2026-09-29"` |
| `entryTime` | `string` | Gate check-in timestamp | `"09:30 AM"` |
| `exitTime` | `string` / `null` | Gate departure timestamp | `"12:30 PM"` or `null` |
| `status` | `string` | Current campus status | `"Inside Campus"` or `"Exited"` |
| `vehicleNo` | `string` | Registered vehicle number or pedestrian | `"KA-05-MH-2024"` |
| `belongings` | `string` | Items carried inside (laptops, tools) | `"Laptop, Projector pointer"` |
| `notes` | `string` | Security notes and remarks | `"Keynote speaker for Tech Symposium"` |
| `createdAt` | `string` / `timestamp`| Record creation timestamp | `"2026-09-29T09:30:00.000Z"` |

---

### Collection: `notifications`
Stores live campus arrival alerts, gate security dispatches, and host notifications.

| Field Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Notification ID | `"NOTIF-101"` |
| `title` | `string` | Alert heading | `"New Visitor Arrived"` |
| `message` | `string` | Alert content message | `"Dr. Rajesh Kumar has checked in."` |
| `visitorName` | `string` | Name of associated visitor | `"Dr. Rajesh Kumar"` |
| `visitorId` | `string` | Identifier tag of visitor | `"VIS-2026-001"` |
| `department` | `string` | Target department | `"Computer Science & Engineering"` |
| `timestamp` | `string` | Display timestamp | `"15 mins ago"` |
| `type` | `string` | Alert type | `"arrival"` \| `"info"` \| `"warning"` |
| `unread` | `boolean` | Read / unread status | `true` or `false` |
| `createdAt` | `string` / `timestamp`| Creation timestamp | `"2026-09-29T09:30:00.000Z"` |

---

### Collection: `users`
Stores security officers, gate sentinels, and administrative credentials.

| Field Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `uid` | `string` | Firebase Auth UID | `"z8Qh...9w"` |
| `name` | `string` | Full officer name | `"Capt. R. K. Mukherjee"` |
| `email` | `string` | Institutional email | `"admin@college.edu"` |
| `role` | `string` | Campus designation | `"Chief Security Officer & Admin"` |
| `phone` | `string` | Intercom / duty phone | `"+91 98450 11223"` |
| `campus` | `string` | Assigned gate / station | `"Main North Campus, Block-A Gate 1"` |
| `shift` | `string` | Duty shift timing | `"General Security Shift (08:00 AM - 08:00 PM)"` |
| `createdAt` | `string` / `timestamp`| Registration timestamp | `"2026-09-29T08:00:00.000Z"` |

---

## 3. Cloud Firestore Security Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Validate visitor payload
    function isValidVisitor(data) {
      return data.name is string && data.name.size() > 0 &&
             data.phone is string && data.phone.size() > 0 &&
             data.purpose is string &&
             data.department is string &&
             data.hostName is string;
    }

    // Visitors Collection
    match /visitors/{visitorId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isValidVisitor(request.resource.data);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }

    // Notifications Collection
    match /notifications/{notificationId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }

    // Users Collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
  }
}
```

---

## 4. Key Viva Questions & Explanations

1. **Why use Firebase over Express + MongoDB for this project?**
   - Firebase provides out-of-the-box real-time subscriptions (`onSnapshot`), managed authentication with built-in security, automatic horizontal scaling, offline data persistence, and eliminates server hosting/maintenance overhead.

2. **How does Route Protection work in the Frontend?**
   - `AuthService.requireAuth()` is invoked on page load (`DOMContentLoaded`). It queries `firebase.auth().onAuthStateChanged(user)` and checks the cached session. If no authenticated user is found, the visitor is redirected to `login.html`.

3. **How are Visitor IDs Generated?**
   - When registering a visitor in `VisitorService.addVisitor()`, the service counts existing records in Firestore and formats the identifier as `VIS-YYYY-XXX` (e.g. `VIS-2026-001`), ensuring institutional standardization.

4. **How does the Digital Visitor Pass render the QR code?**
   - The pass uses an algorithmic vector SVG generator `generateQRCodeSVG(dataString)` encoding the pass payload (`COLLEGE-PASS|ID|NAME|DEPT|DATE|STATUS`). This allows physical scanning at gate checkpoints without external third-party API dependencies.
