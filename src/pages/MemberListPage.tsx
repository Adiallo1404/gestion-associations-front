import { useEffect, useState } from "react";
import { getMembers, deleteMember } from "../api/memberService";
import { useNavigate } from "react-router-dom";
import type { Member } from "../types/member";

export default function MemberListPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [page, setPage] = useState(0);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const data = await getMembers(filters, page);
      setMembers(data.content);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, page]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce membre ?")) return;
    await deleteMember(id);
    fetchData();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#2c3e50", textAlign: "center" }}>👥 Membres</h2>

      {/* FILTRES */}
      <div style={{ marginBottom: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          placeholder="Prénom"
          style={inputStyle}
          onChange={(e) => { setPage(0); setFilters({ ...filters, firstName: e.target.value }); }}
        />
        <input
          placeholder="Nom"
          style={inputStyle}
          onChange={(e) => { setPage(0); setFilters({ ...filters, lastName: e.target.value }); }}
        />
        <input
          placeholder="Email"
          style={inputStyle}
          onChange={(e) => { setPage(0); setFilters({ ...filters, email: e.target.value }); }}
        />
        <button style={btnPrimary} onClick={fetchData}>
          🔍 Filtrer
        </button>
      </div>

      {/* ADD BUTTON */}
      <div style={{ textAlign: "center", marginBottom: "15px" }}>
        <button style={btnAdd} onClick={() => navigate("/members/new")}>
          ➕ Ajouter un membre
        </button>
      </div>

      {/* TABLE */}
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: "#3498db", color: "white" }}>
            <th style={thStyle}>Nom complet</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Téléphone</th>
            {/* ✅ Colonne Association ajoutée */}
            <th style={thStyle}>Association</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {members.map((m) => (
            <tr key={m.id} style={{ textAlign: "center", borderBottom: "1px solid #eee" }}>
              <td style={tdStyle}>{m.firstName} {m.lastName}</td>
              <td style={tdStyle}>{m.email}</td>
              <td style={tdStyle}>{m.phone}</td>
              {/* ✅ FIX : association est un objet imbriqué */}
              <td style={tdStyle}>{m.associationName || "-"}</td>
              <td style={tdStyle}>
                <button style={btnView} onClick={() => navigate(`/members/${m.id}`)}>👁️</button>
                <button style={btnEdit} onClick={() => navigate(`/members/${m.id}/edit`)}>✏️</button>
                <button style={btnDelete} onClick={() => handleDelete(m.id!)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <button style={btnPage} onClick={() => setPage(page - 1)} disabled={page === 0}>⬅</button>
        <span style={{ margin: "0 10px" }}>Page {page + 1}</span>
        <button style={btnPage} onClick={() => setPage(page + 1)}>➡</button>
      </div>
    </div>
  );
}

/* 🎨 STYLES */
const inputStyle = { padding: "8px", borderRadius: "6px", border: "1px solid #ccc" };
const btnPrimary = { padding: "8px 12px", background: "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };
const btnAdd = { padding: "10px 20px", background: "#2ecc71", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };
const btnView = { marginRight: "5px", background: "#3498db", color: "white", border: "none", padding: "6px 8px", borderRadius: "5px", cursor: "pointer" };
const btnEdit = { marginRight: "5px", background: "#27ae60", color: "white", border: "none", padding: "6px 8px", borderRadius: "5px", cursor: "pointer" };
const btnDelete = { background: "#e74c3c", color: "white", border: "none", padding: "6px 8px", borderRadius: "5px", cursor: "pointer" };
const btnPage = { padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" };
const thStyle = { padding: "12px 16px" };
const tdStyle = { padding: "10px 16px" };