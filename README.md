---
Autamail - Automated Email Management System
---

# Autamail

Autamail is a web application built with Next.js, designed to streamline and automate email management processes. It enables the efficient handling of emails for chief guests, sponsors, and participants within GDG JIIT 128.

## 🚀 Features
- **Automated Email Sending** – Easily send emails with predefined email templates.
- **Firebase Authentication** – Secure login system with Firebase Auth.
- **Firestore & Realtime Database** – Store email logs and manage real-time data updates.
- **User-friendly Dashboard** – Intuitive interface for managing email campaigns.
- **Next.js Framework** – Seamless frontend and backend integration.
- **ShadCN UI Components** – Modern UI built with ShadCN.

## 🛠 Tech Stack
- **Frontend & Backend:** Next.js (App Router)
- **UI Library:** ShadCN UI
- **Authentication:** Firebase Auth
- **Database:** Firestore (for email logs), Firebase Realtime Database
- **Deployment:** Vercel


## 🔧 Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/VaibhavKatariya/Autamail.git
   cd Autamail
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Firebase:
   - Create a Firebase project.
   - Enable Firestore, Realtime Database, and Authentication.
   - Add Firebase credentials to `.env`:
     ```bash
     NEXT_PUBLIC_FIREBASE_API_KEY=demo_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo_auth_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo_storage_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=demo_messaging_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=demo_app_id
     FIREBASE_CLIENT_EMAIL=demo_client_email
     FIREBASE_PRIVATE_KEY="demo_private_key"
     NEXT_PUBLIC_WHATSAPP_NUMBER1=+911234567890
     NEXT_PUBLIC_WHATSAPP_NUMBER2=+919876543210
     NEXT_PUBLIC_WHATSAPP_NUMBER3=+919112233445
     ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🎯 Usage
- Sign in with Firebase Authentication.
- Select recipient categories (Chief Guests, Sponsors, Participants).
- Compose and send automated emails.
- View sent email logs in Firestore.

## 📌 Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📜 License
This project is licensed under the MIT License.

---
Made with ❤️ for GDG JIIT 128
