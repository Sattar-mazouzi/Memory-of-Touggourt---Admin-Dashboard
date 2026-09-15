<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Memory of Touggourt - Admin Dashboard

Welcome to the comprehensive guide for the **Memory of Touggourt Admin Dashboard**. This application serves as the central management hub for documenting, protecting, and showcasing the ancient heritage of Touggourt, the jewel of the oases and the eternal memory of the Sahara.

View your app in AI Studio: https://ai.studio/apps/acf686df-90ec-4466-91d2-ea4768bb609f

---

## 🏢 Comprehensive Dashboard Guide

The admin dashboard is a multilingual (Arabic, English, French) portal designed for managing tourism data, user access, and dynamic app content. 

### Available Options & Modules:

*   **📊 Dashboard (Analytics Hub):** A birds-eye view of your platform's health. Displays overall visitor analytics, app usage, registered users, most favorited places, top-rated destinations, and category distribution charts.
*   **📍 Places Management:** The core CRM for tourism assets. Admins and Content Managers can add, edit, or delete tourist spots. Features include:
    *   Multilingual names, descriptions, and addresses.
    *   Precise GPS coordinates (latitude/longitude) and interactive city mapping.
    *   Advanced media management (Cover images, up to 5 gallery images, 3D visualization slots, and 3 YouTube video integrations).
    *   Granular display ordering (`order` and `categoryOrder`) to control layout placement in the main app.
*   **🖼️ Gallery Manager:** Centralized repository for all standalone media (photos and videos) used across the application.
*   **🏛️ About City (City Information Editor):** A dedicated CMS for Touggourt's historical and cultural encyclopedia. Manage rich text covering geography, climate, topography, tangible/intangible heritage, traditional industries, clothing, folklore, and culinary arts.
*   **📑 Categories Management:** Dynamically create and modify categories (e.g., Religious, Historical, Cultural, Nature) without touching the codebase.
*   **👥 Staff Management:** Role-Based Access Control (RBAC). Assign team members as either `System Admin` (full access) or `Content Manager` (restricted to content editing and metrics viewing).
*   **⚙️ Settings & Profile:** Personalized user settings, profile updates, and authentication state management.
*   **🎨 App Branding & About App:** Customize the mobile/client app's identity, logos, contributor credits (up to 5 contributors), owner biographies, and administrative contact details.

---

## 🏗️ App Infrastructure & Technology Stack

The application is built on a modern, highly scalable full-stack architecture prioritizing performance, real-time synchronization, and developer experience.

### 💻 Programming Languages & Frameworks
*   **Frontend Library:** React 19 (using Functional Components & Hooks)
*   **Language:** TypeScript for strict type-safety and robust data models.
*   **Build Tool:** Vite for blazing-fast Hot Module Replacement (HMR) and optimized production builds.
*   **Styling:** Tailwind CSS for rapid, utility-first UI design and fully responsive, mobile-first layouts.

### 🗄️ Storage & Databases
*   **Database:** Firebase Firestore (NoSQL). Handles real-time data synchronization for places, analytics, city configurations, and user roles. Features custom security rules ensuring strict data access patterns based on RBAC.
*   **Media Storage:** Cloudinary API. All images uploaded through the dashboard are securely hosted and served via Cloudinary's global CDN for optimal loading speeds and auto-optimization.
*   **Local State:** Browser `localStorage` is utilized for persisting user preferences like the dashboard's active language state (Arabic/English/French).

### 🔌 APIs & Services
*   **Authentication:** Firebase Authentication manages secure user logins, sessions, and role verification middleware.
*   **Data Visualization:** Recharts library for rendering responsive, interactive pie charts and visitor analytic graphs.
*   **Iconography:** Lucide-React for consistent, high-quality, and scalable SVG icons across the administrative interface.

---

## 🚀 Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
