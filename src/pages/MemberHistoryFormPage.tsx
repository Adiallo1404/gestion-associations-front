import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMemberHistory } from "../api/memberHistoryService";
import { getAssociations } from "../api/associationService";
import { getMembers } from "../api/memberService";
import { getUsers } from "../api/userService";
import { StatutMembreOptions } from "../types/memberHistory";
import type { StatutMembre } from "../types/memberHistory";

export default function MemberHistoryFormPage() {
  const navigate = useNavigate();

  const [associations, setAssociations] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [associationId, setAssociationId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [modifieParId, setModifieParId] = useState("");
  const [ancienStatut, setAncienStatut] = useState("");
  const [nouveauStatut, setNouveauStatut] = useState<StatutMembre>("ACTIF");
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await getAssociations(0, 1000);
      setAssociations(res.content || []);
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      const res = await getUsers(0, 1000);
      setUsers(res.content || []);
    };
    load();
  }, []);

  useEffect(() => {
    const loadMembers = async () => {
      if (!associationId) {
        setMembers([]);
        return;
      }
      try {
        const res = await getMembers({ page: 0, size: 1000 });
        const filtered = (res.content || []).filter(
          (m: any) => m.associationId === Number(associationId)
        );
        setMembers(filtered);
      } catch (err) {
        console.error("Erreur getMembers :", err);
      }
    };
    loadMembers();
  }, [associationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createMemberHistory({
        memberId: Number(memberId),
        associationId: Number(associationId),
        modifieParId: modifieParId ? Number(modifieParId) : undefined,
        ancienStatut: ancienStatut ? (ancienStatut as StatutMembre) : undefined,
        nouveauStatut,
        motif,
      });
      navigate("/member-histories");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <div style={card}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button style={btnBack} onClick={() => navigate(-1)}>← Retour</button>
          <button style={btnDashboard} onClick={() => navigate("/")}>🏠 Tableau de bord</button>
        </div>

        <h1 style={title}>➕ Créer un historique</h1>

        {error && <p style={errorStyle}>{error}</p>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <div>
            <label style={labelStyle}>Association *</label>
            <select value={associationId} onChange={(e) => { setAssociationId(e.target.value); setMemberId(""); }} required style={inputStyle}>
              <option value="">-- Choisir --</option>
              {associations.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Membre *</label>
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} required style={inputStyle}>
              <option value="">-- Choisir --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Modifié par</label>
            <select value={modifieParId} onChange={(e) => setModifieParId(e.target.value)} style={inputStyle}>
              <option value="">-- Système --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Ancien statut</label>
            <select value={ancienStatut} onChange={(e) => setAncienStatut(e.target.value)} style={inputStyle}>
              <option value="">-- Aucun --</option>
              {StatutMembreOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Nouveau statut *</label>
            <select value={nouveauStatut} onChange={(e) => setNouveauStatut(e.target.value as StatutMembre)} style={inputStyle}>
              {StatutMembreOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Motif</label>
            <input type="text" value={motif} onChange={(e) => setMotif(e.target.value)} style={inputStyle} />
          </div>

          <button type="submit" disabled={loading} style={btnSave}>
            {loading ? "⏳ Création..." : "✅ Créer"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Styles inchangés
const container = { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f4f6f9", padding: "20px" };
const card = { background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", width: "100%", maxWidth: "420px" };
const title = { textAlign: "center" as const, fontSize: "26px", fontWeight: "bold", color: "#2c3e50", borderBottom: "2px solid #27ae60", paddingBottom: "10px", marginBottom: "20px" };
const formStyle = { display: "flex", flexDirection: "column" as const, gap: "15px" };
const labelStyle = { fontWeight: "bold", marginBottom: "5px", display: "block" };
const inputStyle = { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" };
const btnSave = { padding: "12px", background: "#27ae60", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" };
const btnBack = { background: "#bdc3c7", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "14px" };
const btnDashboard = { background: "#2563eb", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "14px" };
const errorStyle = { color: "red", textAlign: "center" as const };