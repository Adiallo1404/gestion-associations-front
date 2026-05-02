import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';

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

const PR = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

function App() {
  return (
    <div style={{
      margin: 0,
      padding: 0,
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      position: "fixed",
      top: 0,
      left: 0,
    }}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>

            {/* ✅ Route publique */}
            <Route path="/login" element={<LoginPage />} />

            {/* ✅ Routes protégées */}
            <Route path="/" element={<PR><DashboardPage /></PR>} />

            <Route path="/associations" element={<PR><AssociationListPage /></PR>} />
            <Route path="/associations/new" element={<PR><AssociationFormPage /></PR>} />
            <Route path="/associations/:id" element={<PR><AssociationDetailPage /></PR>} />
            <Route path="/associations/:id/edit" element={<PR><AssociationFormPage /></PR>} />

            <Route path="/users" element={<PR><UserListPage /></PR>} />
            <Route path="/users/new" element={<PR><UserFormPage /></PR>} />
            <Route path="/users/:id" element={<PR><UserDetailPage /></PR>} />
            <Route path="/users/:id/edit" element={<PR><UserFormPage /></PR>} />

            <Route path="/members" element={<PR><MemberListPage /></PR>} />
            <Route path="/members/new" element={<PR><MemberFormPage /></PR>} />
            <Route path="/members/:id" element={<PR><MemberDetailPage /></PR>} />
            <Route path="/members/:id/edit" element={<PR><MemberFormPage /></PR>} />

            <Route path="/member-histories" element={<PR><MemberHistoryListPage /></PR>} />
            <Route path="/member-histories/new" element={<PR><MemberHistoryFormPage /></PR>} />
            <Route path="/member-histories/:id" element={<PR><MemberHistoryDetailPage /></PR>} />

            <Route path="/cotisations" element={<PR><CotisationListPage /></PR>} />
            <Route path="/cotisations/new" element={<PR><CotisationFormPage /></PR>} />
            <Route path="/cotisations/:id" element={<PR><CotisationDetailPage /></PR>} />
            <Route path="/cotisations/:id/edit" element={<PR><CotisationFormPage /></PR>} />

            <Route path="/emails-envoyes" element={<PR><EmailListPage /></PR>} />
            <Route path="/emails-envoyes/new" element={<PR><EmailFormPage /></PR>} />
            <Route path="/emails-envoyes/:id" element={<PR><EmailDetailPage /></PR>} />
            <Route path="/email-codes" element={<PR><EmailCodeFormPage /></PR>} />

            <Route path="/documents" element={<PR><DocumentListPage /></PR>} />
            <Route path="/documents/new" element={<PR><DocumentFormPage /></PR>} />
            <Route path="/documents/:id" element={<PR><DocumentDetailPage /></PR>} />

            <Route path="/notifications" element={<PR><NotificationListPage /></PR>} />
            <Route path="/notifications/new" element={<PR><NotificationFormPage /></PR>} />
            <Route path="/notifications/:id" element={<PR><NotificationDetailPage /></PR>} />

            <Route path="/roles" element={<PR><RoleListPage /></PR>} />
            <Route path="/roles/new" element={<PR><RoleFormPage /></PR>} />
            <Route path="/roles/:id" element={<PR><RoleDetailPage /></PR>} />
            <Route path="/roles/:id/edit" element={<PR><RoleFormPage /></PR>} />

            <Route path="/user-association-roles" element={<PR><UserAssociationRoleListPage /></PR>} />
            <Route path="/user-association-roles/new" element={<PR><UserAssociationRoleFormPage /></PR>} />
            <Route path="/user-association-roles/:userId/:associationId" element={<PR><UserAssociationRoleDetailPage /></PR>} />
            <Route path="/user-association-roles/:id/edit" element={<PR><UserAssociationRoleFormPage /></PR>} />

            <Route path="/cotisation-configs" element={<PR><CotisationConfigListPage /></PR>} />
            <Route path="/cotisation-configs/new" element={<PR><CotisationConfigFormPage /></PR>} />
            <Route path="/cotisation-configs/association/:associationId" element={<PR><CotisationConfigDetailPage /></PR>} />
            <Route path="/cotisation-configs/association/:associationId/edit" element={<PR><CotisationConfigFormPage /></PR>} />

            <Route path="/liens-partage" element={<PR><LienPartageListPage /></PR>} />
            <Route path="/liens-partage/new" element={<PR><LienPartageFormPage /></PR>} />
            <Route path="/liens-partage/:id" element={<PR><LienPartageDetailPage /></PR>} />

            <Route path="*" element={<PR><DashboardPage /></PR>} />

          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;