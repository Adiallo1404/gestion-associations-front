import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import AboutPage from './pages/AboutPage';

import DashboardPage from './pages/DashboardPage';
import AssociationListPage from './pages/AssociationListPage';
import AssociationDetailPage from './pages/AssociationDetailPage';
import AssociationFormPage from './pages/AssociationFormPage';
import UserListPage from './pages/UserListPage';
import UserDetailPage from './pages/UserDetailPage';
import UserFormPage from './pages/UserFormPage';
import MemberListPage from './pages/MemberListPage';
import MemberDetailPage from './pages/MemberDetailPage';
import MemberFormPage from './pages/MemberFormPage';
import MemberHistoryListPage from "./pages/MemberHistoryListPage";
import MemberHistoryDetailPage from "./pages/MemberHistoryDetailPage";
import MemberHistoryFormPage from "./pages/MemberHistoryFormPage";
import CotisationListPage from "./pages/CotisationListPage";
import CotisationFormPage from "./pages/CotisationFormPage";
import CotisationDetailPage from "./pages/CotisationDetailPage";
import EmailListPage from "./pages/EmailEnvoyeListPage";
import EmailDetailPage from "./pages/EmailEnvoyeDetailPage";
import EmailFormPage from "./pages/EmailEnvoyeFormPage";
import EmailCodeFormPage from "./pages/EmailCodeFormPage";
import DocumentListPage from "./pages/DocumentListPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import DocumentFormPage from "./pages/DocumentFormPage";
import NotificationListPage from "./pages/NotificationListPage";
import NotificationDetailPage from "./pages/NotificationDetailPage";
import NotificationFormPage from "./pages/NotificationFormPage";
import RoleListPage from "./pages/RoleListPage";
import RoleDetailPage from "./pages/RoleDetailPage";
import RoleFormPage from "./pages/RoleFormPage";
import CotisationConfigListPage from "./pages/CotisationConfigListPage";
import CotisationConfigDetailPage from "./pages/CotisationConfigDetailPage";
import CotisationConfigFormPage from "./pages/CotisationConfigFormPage";
import LienPartageListPage from "./pages/LienPartageListPage";
import LienPartageFormPage from "./pages/LienPartageFormPage";
import LienPartageDetailPage from "./pages/LienPartageDetailPage";
import UserAssociationRoleListPage from "./pages/UserAssociationRoleListPage";
import UserAssociationRoleDetailPage from "./pages/UserAssociationRoleDetailPage";
import UserAssociationRoleFormPage from "./pages/UserAssociationRoleFormPage";
import MyProfilePage from './pages/MyProfilePage';
import type { GlobalRole } from './hooks/useRole';

const PR = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const PRL = ({ children, roles }: { children: React.ReactNode; roles: GlobalRole[] }) => (
  <ProtectedRoute roles={roles}>{children}</ProtectedRoute>
);

function App() {
  return (
    <div style={{
      margin: 0, padding: 0,
      width: "100vw", height: "100vh",
      overflow: "hidden", position: "fixed",
      top: 0, left: 0,
    }}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>

            {/* ─── PUBLIC ─── */}
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />
            <Route path="/about"           element={<AboutPage />} />

            {/* ─── DASHBOARD ─── */}
            <Route path="/" element={<PR><DashboardPage /></PR>} />

            {/* ─── ASSOCIATIONS ─── */}
            <Route path="/associations"
              element={<PR><AssociationListPage /></PR>} />
            <Route path="/associations/new"
              element={<PRL roles={['SUPER_ADMIN']}><AssociationFormPage /></PRL>} />
            <Route path="/associations/:id"
              element={<PR><AssociationDetailPage /></PR>} />
            <Route path="/associations/:id/edit"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><AssociationFormPage /></PRL>} />

            {/* ─── MON PROFIL ─── */}
            <Route path="/users/me"
              element={<PR><MyProfilePage /></PR>} />

            {/* ─── UTILISATEURS ─── */}
            <Route path="/users"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><UserListPage /></PRL>} />
            <Route path="/users/new"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><UserFormPage /></PRL>} />
            <Route path="/users/:id"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><UserDetailPage /></PRL>} />
            <Route path="/users/:id/edit"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><UserFormPage /></PRL>} />

            {/* ─── MEMBRES ─── */}
            <Route path="/members"
              element={<PR><MemberListPage /></PR>} />
            <Route path="/members/new"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><MemberFormPage /></PRL>} />
            <Route path="/members/:id"
              element={<PR><MemberDetailPage /></PR>} />
            <Route path="/members/:id/edit"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><MemberFormPage /></PRL>} />

            {/* ─── HISTORIQUE MEMBRES ─── */}
            <Route path="/member-histories"
              element={<PR><MemberHistoryListPage /></PR>} />
            <Route path="/member-histories/new"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><MemberHistoryFormPage /></PRL>} />
            <Route path="/member-histories/:id"
              element={<PR><MemberHistoryDetailPage /></PR>} />

            {/* ─── COTISATIONS ─── */}
            <Route path="/cotisations"
              element={<PR><CotisationListPage /></PR>} />
            <Route path="/cotisations/new"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><CotisationFormPage /></PRL>} />
            <Route path="/cotisations/:id"
              element={<PR><CotisationDetailPage /></PR>} />
            <Route path="/cotisations/:id/edit"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><CotisationFormPage /></PRL>} />

            {/* ─── EMAILS ENVOYÉS ─── */}
            <Route path="/emails-envoyes"
              element={<PR><EmailListPage /></PR>} />
            <Route path="/emails-envoyes/new"
              element={<PR><EmailFormPage /></PR>} />
            <Route path="/emails-envoyes/:id"
              element={<PR><EmailDetailPage /></PR>} />
            <Route path="/email-codes"
              element={<PR><EmailCodeFormPage /></PR>} />

            {/* ─── DOCUMENTS ─── */}
            <Route path="/documents"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><DocumentListPage /></PRL>} />
            <Route path="/documents/new"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><DocumentFormPage /></PRL>} />
            <Route path="/documents/:id"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><DocumentDetailPage /></PRL>} />

            {/* ─── NOTIFICATIONS ─── */}
            <Route path="/notifications"
              element={<PR><NotificationListPage /></PR>} />
            <Route path="/notifications/new"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><NotificationFormPage /></PRL>} />
            <Route path="/notifications/:id"
              element={<PR><NotificationDetailPage /></PR>} />

            {/* ─── RÔLES ─── */}
            <Route path="/roles"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><RoleListPage /></PRL>} />
            <Route path="/roles/new"
              element={<PRL roles={['SUPER_ADMIN']}><RoleFormPage /></PRL>} />
            <Route path="/roles/:id"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><RoleDetailPage /></PRL>} />
            <Route path="/roles/:id/edit"
              element={<PRL roles={['SUPER_ADMIN']}><RoleFormPage /></PRL>} />

            {/* ─── USER-ASSOCIATION-ROLES ─── */}
            <Route path="/user-association-roles"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><UserAssociationRoleListPage /></PRL>} />
            <Route path="/user-association-roles/new"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><UserAssociationRoleFormPage /></PRL>} />
            <Route path="/user-association-roles/:userId/:associationId"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><UserAssociationRoleDetailPage /></PRL>} />
            <Route path="/user-association-roles/:id/edit"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><UserAssociationRoleFormPage /></PRL>} />

            {/* ─── COTISATION CONFIG ─── */}
            <Route path="/cotisation-configs"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><CotisationConfigListPage /></PRL>} />
            <Route path="/cotisation-configs/new"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><CotisationConfigFormPage /></PRL>} />
            <Route path="/cotisation-configs/association/:associationId"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><CotisationConfigDetailPage /></PRL>} />
            <Route path="/cotisation-configs/association/:associationId/edit"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><CotisationConfigFormPage /></PRL>} />

            {/* ─── LIENS DE PARTAGE ─── */}
            <Route path="/liens-partage"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><LienPartageListPage /></PRL>} />
            <Route path="/liens-partage/new"
              element={<PRL roles={['ADMIN', 'SUPER_ADMIN']}><LienPartageFormPage /></PRL>} />
            <Route path="/liens-partage/:id"
              element={<PR><LienPartageDetailPage /></PR>} />

            {/* ─── 404 ─── */}
            <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;