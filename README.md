# Association Management Platform — Frontend

A modern React application for managing associations, members, contributions, projects, documents, notifications, and administration workflows.

Built with **React**, **TypeScript** and **Vite**, the application provides an intuitive, responsive user experience for association management, secured end-to-end through **Keycloak** (OpenID Connect / OAuth2) for centralized authentication and role-based access control.

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| Frontend Application | https://gestion-associations-front.vercel.app |
| Backend API | https://gestionassociations.onrender.com |
| Identity Provider (Keycloak) | https://gestassoc-keycloak-v2.onrender.com |

---

## 🚀 Overview

The platform enables associations and non-profit organizations to manage their operations through a centralized, secure web application.

### Core Domains

- 👥 Member Management
- 💰 Contributions & Payments
- 🏛️ Bureau & Governance
- 📅 Events & Activities
- 📁 Document Management
- 📨 Email Communication
- 🔔 Notifications
- 📊 Dashboard & Analytics
- 🔐 Role-Based Access Control (Keycloak)

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Routing | React Router DOM |
| HTTP Client | Axios |
| Data Fetching | TanStack Query |
| Charts | Chart.js |
| Notifications | React Toastify |
| PDF Generation | jsPDF |
| Authentication | Keycloak (OpenID Connect / OAuth2) |
| Deployment | Vercel |

---

## ✨ Features

### 📊 Dashboard
- Global statistics
- Member analytics
- Contribution analytics
- Recent activity overview

### 👥 Member Management
- Create and update member records
- Member history tracking
- Association assignment

### 💰 Contributions & Payments
- Contribution management
- Payment tracking
- Due date monitoring
- Status management

### 🏛️ Association Administration
- Association management
- User management
- Role assignment

### 📁 Documents
- Document management
- Secure sharing links

### 📨 Notifications
- Notification management
- Email integration

### 🔐 Security
- OAuth2 / OpenID Connect authentication via **Keycloak**
- Centralized identity and access management, independent of the application layer
- Role-Based Access Control (RBAC): `USER`, `ADMIN`, `SUPER_ADMIN`
- Route-level authorization based on realm roles
- Automatic silent token refresh via `keycloak-js`
- Stateless session handling (no credentials stored in the frontend)

---

## 🏗️ Authentication Architecture

Authentication is fully delegated to Keycloak rather than implemented in-house:

The frontend attaches the Keycloak-issued JWT to every backend request. The backend independently validates it against Keycloak's public keys.

This approach follows industry-standard practices for authentication:

- No passwords are ever handled or stored by the application itself
- Tokens are short-lived and refreshed transparently
- The frontend uses a dedicated **public client** (`gestassoc-front`), separate from the backend's **confidential client** (`gestassoc-api`), following OAuth2 client-type best practices
- Authorization Code flow with PKCE, as required for browser-based single-page applications

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- Access to a running Keycloak instance with the `gestassoc` realm configured

### Clone the Repository

```bash
git clone https://github.com/Adiallo1404/gestion-associations-front.git
cd gestion-associations-front
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file at the project root:

```dotenv
VITE_API_URL=http://localhost:8082
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=gestassoc
VITE_KEYCLOAK_CLIENT_ID=gestassoc-front
```

### Run the Application

```bash
npm run dev
```

Application available at: `http://localhost:5173`

### Build for Production

```bash
npm run build
```

---

## 🔗 Related Resources

| Resource | Link |
|---|---|
| Backend Repository | https://github.com/Adiallo1404/GestionAssociations |
| API Documentation (Swagger) | https://gestionassociations.onrender.com/swagger-ui/index.html |

---

## 🏗️ Project Structure

src
├── api # HTTP clients, service layer, Keycloak configuration
├── assets
├── components
├── context # Global auth context (Keycloak session, user, role)
├── hooks # Role-based access hooks, custom utilities
├── pages
├── types
├── utils
├── App.tsx
└── main.tsx

---

## 🧪 Development Practices

- TypeScript type safety across the codebase
- Reusable, composable components
- Feature-based folder organization
- Centralized API abstraction layer
- Fully responsive design (mobile, tablet, desktop)
- Route-level protection based on authentication and role
- Clean code principles and separation of concerns

---

## 🗺️ Roadmap

### Completed
- [x] Dashboard
- [x] Keycloak (OIDC) authentication integration
- [x] Member Management
- [x] Contributions Management
- [x] Payments Tracking
- [x] Role Management via Keycloak realm roles
- [x] Notifications
- [x] Responsive UI
- [x] Production deployment (Vercel + Render + Keycloak)

### Future Enhancements
- [ ] Dark Mode
- [ ] Advanced Analytics
- [ ] Real-Time Notifications
- [ ] Accessibility Improvements (WCAG)
- [ ] Internationalization (i18n)

---

## 👨‍💻 Author

**Alassane Diallo**
Frontend & Backend Developer
Focused on building modern, secure and scalable web applications.
