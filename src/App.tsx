import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Associations
import AssociationListPage from './pages/AssociationListPage';
import AssociationDetailPage from './pages/AssociationDetailPage';
import AssociationFormPage from './pages/AssociationFormPage';

// Users
import UserListPage from './pages/UserListPage';
import UserDetailPage from './pages/UserDetailPage';
import UserFormPage from './pages/UserFormPage';

// Members
import MemberListPage from './pages/MemberListPage';
import MemberDetailPage from './pages/MemberDetailPage';
import MemberFormPage from './pages/MemberFormPage';

// Cotisation
import CotisationListPage from "./pages/CotisationListPage";
import CotisationFormPage from "./pages/CotisationFormPage";
import CotisationDetailPage from "./pages/CotisationDetailPage";

function App() {
  return (
    <BrowserRouter>

      {/* NAVBAR (important) */}
      <nav style={{ marginBottom: 20 }}>
        <Link to="/associations">Associations</Link> |{" "}
        <Link to="/members">Membres</Link> |{" "}
        <Link to="/cotisations">Cotisations</Link> |{" "}
        <Link to="/users">Utilisateurs</Link>
      </nav>

      <Routes>

        {/* Associations */}
        <Route path="/" element={<AssociationListPage />} />
        <Route path="/associations" element={<AssociationListPage />} />
        <Route path="/associations/new" element={<AssociationFormPage />} />
        <Route path="/associations/:id" element={<AssociationDetailPage />} />
        <Route path="/associations/:id/edit" element={<AssociationFormPage />} />

        {/* Users */}
        <Route path="/users" element={<UserListPage />} />
        <Route path="/users/new" element={<UserFormPage />} />
        <Route path="/users/:id" element={<UserDetailPage />} />
        <Route path="/users/:id/edit" element={<UserFormPage />} />

        {/* Members */}
        <Route path="/members" element={<MemberListPage />} />
        <Route path="/members/new" element={<MemberFormPage />} />
        <Route path="/members/:id" element={<MemberDetailPage />} />
        <Route path="/members/:id/edit" element={<MemberFormPage />} />


        <Route path="/cotisations" element={<CotisationListPage />} />
<Route path="/cotisations/new" element={<CotisationFormPage />} />
<Route path="/cotisations/:id" element={<CotisationDetailPage />} />
<Route path="/cotisations/:id/edit" element={<CotisationFormPage />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;