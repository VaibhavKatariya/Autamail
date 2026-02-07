
# Autamail – Automated Email Management System

Autamail is a role-based, approval-driven email management platform built with Next.js (App Router) and Firebase.
It is designed to safely queue, approve, send, and audit emails at scale while keeping Firestore reads optimized and all sensitive logic server-side.

---

## 🚀 What’s New

- Firebase Realtime Database removed
- Firestore only (single source of truth)
- All Firebase access moved to API routes
- No client-side Firestore reads
- Role-based access using custom claims
- Paginated APIs (10 items per page)
- Context-based caching to avoid repeated reads
- ZeptoMail Template API integration

---

## ✨ Core Features

### Email Queue & Approval
- Users queue emails instead of sending directly
- Admins approve or reject queued emails
- Approved emails are sent using ZeptoMail templates
- Every email action is logged

### Role-Based Access
- Admin: approve emails, view global logs, manage users
- User: queue emails, view own sent logs

### Logs System
- Global logs for admins
- User-specific logs via reference subcollection
- Fully paginated

### Deduplication
- emailIndex collection prevents duplicate queue/send
- O(1) lookup using hashed email keys

---

## 🧱 Firestore Schema

### queuedEmails/{id}
```json
{
  "email": "user@example.com",
  "name": "User",
  "template": "Chief",
  "fromEmail": "sender@example.com",
  "requestedBy": "uid",
  "requestedAt": "timestamp",
  "status": "queued"
}
```

### sentEmails/{id}
```json
{
  "email": "user@example.com",
  "name": "User",
  "template": "Chief",
  "fromEmail": "sender@example.com",
  "requestedBy": "uid",
  "requestedAt": "timestamp",
  "sentAt": "timestamp",
  "status": "sent",
  "requestId": "zeptomail-request-id"
}
```

### users/{uid}/sentEmailRefs/{id}
```json
{
  "sentAt": "timestamp",
  "status": "sent",
  "requestId": "zeptomail-request-id"
}
```

### emailIndex/{hashedEmail}
```json
{
  "email": "user@example.com",
  "status": "sent",
  "lastUpdated": "timestamp"
}
```

---

## 🔌 API Routes

- POST /api/queueEmails
- GET /api/getQueuedEmails
- POST /api/reviewQueuedEmails
- GET /api/emailLogs
- GET /api/users
- GET /api/manageUsers
- POST /api/setCustomClaim
- POST /api/request-access
- DELETE /api/deleteUser

---

## 🧠 Client Architecture

- AuthContext
- QueuedEmailsContext
- EmailLogsContext
- UsersDataContext

All contexts cache API responses to prevent redundant calls.

---

## ⚙️ Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=demo_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=demo_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=demo_app_id
FIREBASE_CLIENT_EMAIL=demo_client_email
FIREBASE_PRIVATE_KEY="demo_private_key"
NEXT_PUBLIC_WHATSAPP_NUMBER1=+911234567890
BASE_URL=http://localhost:3000
NEXT_PUBLIC_MAINTENANCE_MODE=false
ZEPTOMAIL_API_KEY=demo_zeptomail_api_key
```

---
📁 Folder Structure


```
└── 📁src
    └── 📁app
        └── 📁api
            └── 📁deleteUser
                ├── route.jsx
            └── 📁emailLogs
                ├── route.js
            └── 📁findUser
                ├── route.js
            └── 📁getQueuedEmails
                ├── route.js
            └── 📁manageUsers
                ├── route.js
            └── 📁queueEmails
                ├── route.js
            └── 📁request-access
                ├── route.js
            └── 📁reviewQueuedEmails
                ├── route.js
            └── 📁setCustomClaim
                ├── route.jsx
            └── 📁users
                ├── route.js
        └── 📁dashboard
            └── 📁approveEmail
                ├── layout.jsx
                ├── page.jsx
            └── 📁logs
                ├── page.jsx
            └── 📁manageUsers
                ├── layout.jsx
                ├── page.jsx
            ├── layout.js
            ├── page.jsx
        └── 📁fonts
            ├── GeistMonoVF.woff
            ├── GeistVF.woff
        └── 📁requestAccess
            ├── page.jsx
        ├── favicon.ico
        ├── globals.css
        ├── layout.js
        ├── page.js
    └── 📁components
        └── 📁skeletonUI
            ├── approveEmailsSkeleton.jsx
            ├── logsLoading.js
            ├── requestAccessSkeleton.jsx
            ├── sendEmailForm.jsx
        └── 📁ui
            ├── accordion.jsx
            ├── alert-dialog.jsx
            ├── avatar.jsx
            ├── button.jsx
            ├── card.jsx
            ├── dialog.jsx
            ├── dropdown-menu.jsx
            ├── input.jsx
            ├── label.jsx
            ├── select.jsx
            ├── separator.jsx
            ├── sheet.jsx
            ├── sidebar.jsx
            ├── skeleton.jsx
            ├── sonner.jsx
            ├── table.jsx
            ├── tabs.jsx
            ├── tooltip.jsx
        ├── addUser.jsx
        ├── AdvanceEmailLog.jsx
        ├── approveUser.jsx
        ├── BlockedUserOverlay.jsx
        ├── ClientOnly.jsx
        ├── EmailLogs.jsx
        ├── nav-user.jsx
        ├── QueueEmailForm.jsx
        ├── sidebar.jsx
        ├── usersList.jsx
        ├── version-switcher.jsx
    └── 📁context
        ├── AuthContext.js
        ├── EmailLogsContext.js
        ├── QueuedEmailsContext.jsx
        ├── UsersDataContext.jsx
    └── 📁hooks
        ├── use-mobile.jsx
    └── 📁lib
        ├── firebase.js
        ├── utils.js
    └── 📁utils
        └── firebaseAdmin.js
```
---

## 🔐 Security

- No Firestore access from client
- All writes through API
- Admin-only routes protected at layout + API level
- Deduplication enforced at DB level
