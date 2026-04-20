import { BrowserRouter, Routes, Route } from 'react-router-dom';

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
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/associations" element={<AssociationListPage />} />
          <Route path="/associations/new" element={<AssociationFormPage />} />
          <Route path="/associations/:id" element={<AssociationDetailPage />} />
          <Route path="/associations/:id/edit" element={<AssociationFormPage />} />
          <Route path="/users" element={<UserListPage />} />
          <Route path="/users/new" element={<UserFormPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/users/:id/edit" element={<UserFormPage />} />
          <Route path="/members" element={<MemberListPage />} />
          <Route path="/members/new" element={<MemberFormPage />} />
          <Route path="/members/:id" element={<MemberDetailPage />} />
          <Route path="/members/:id/edit" element={<MemberFormPage />} />
          <Route path="/member-histories" element={<MemberHistoryListPage />} />
          <Route path="/member-histories/new" element={<MemberHistoryFormPage />} />
          <Route path="/member-histories/:id" element={<MemberHistoryDetailPage />} />
          <Route path="/cotisations" element={<CotisationListPage />} />
          <Route path="/cotisations/new" element={<CotisationFormPage />} />
          <Route path="/cotisations/:id" element={<CotisationDetailPage />} />
          <Route path="/cotisations/:id/edit" element={<CotisationFormPage />} />
          <Route path="/emails-envoyes" element={<EmailListPage />} />
          <Route path="/emails-envoyes/new" element={<EmailFormPage />} />
          <Route path="/emails-envoyes/:id" element={<EmailDetailPage />} />
          <Route path="/email-codes" element={<EmailCodeFormPage />} />
          <Route path="/documents" element={<DocumentListPage />} />
          <Route path="/documents/new" element={<DocumentFormPage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/notifications" element={<NotificationListPage />} />
          <Route path="/notifications/new" element={<NotificationFormPage />} />
          <Route path="/notifications/:id" element={<NotificationDetailPage />} />
          <Route path="/roles" element={<RoleListPage />} />
          <Route path="/roles/new" element={<RoleFormPage />} />
          <Route path="/roles/:id" element={<RoleDetailPage />} />
          <Route path="/roles/:id/edit" element={<RoleFormPage />} />
          <Route path="/user-association-roles" element={<UserAssociationRoleListPage />} />
          <Route path="/user-association-roles/new" element={<UserAssociationRoleFormPage />} />
          <Route path="/user-association-roles/:userId/:associationId" element={<UserAssociationRoleDetailPage />} />
          <Route path="/user-association-roles/:id/edit" element={<UserAssociationRoleFormPage />} />
          <Route path="/cotisation-configs" element={<CotisationConfigListPage />} />
          <Route path="/cotisation-configs/new" element={<CotisationConfigFormPage />} />
          <Route path="/cotisation-configs/association/:associationId" element={<CotisationConfigDetailPage />} />
          <Route path="/cotisation-configs/association/:associationId/edit" element={<CotisationConfigFormPage />} />
          <Route path="/liens-partage" element={<LienPartageListPage />} />
          <Route path="/liens-partage/new" element={<LienPartageFormPage />} />
          <Route path="/liens-partage/:id" element={<LienPartageDetailPage />} />
          <Route path="*" element={<DashboardPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;