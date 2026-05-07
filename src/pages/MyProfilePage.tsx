import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, updateMyProfile } from "../api/userService";
import type { User } from "../types/user";

export default function MyProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });

  useEffect(() => {
    getMyProfile()
      .then((data) => {
        setUser(data);
        setForm({ firstName: data.firstName ?? "", lastName: data.lastName ?? "", email: data.email ?? "" });
      })
      .catch(() => setError("Impossible de charger votre profil."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMyProfile({ ...user, ...form });
      setUser(updated);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
    SUPER_ADMIN: { bg: "#7c3aed", color: "#fff" },
    ADMIN:       { bg: "#1d4ed8", color: "#fff" },
    USER:        { bg: "#16a34a", color: "#fff" },
  };
  const badge = user?.globalRole ? ROLE_BADGE[user.globalRole] : null;

  if (loading) return <p style={s.msg}>Chargement...</p>;
  if (error && !user) return <p style={{ ...s.msg, color: "#dc2626" }}>{error}</p>;

  return (
    <div style={s.page}>
      <button style={s.back} onClick={() => navigate("/")}>← Tableau de bord</button>

      <div style={s.card}>
        {/* ── En-tête avatar ── */}
        <div style={s.header}>
          <div style={s.avatar}>{initials}</div>
          <div>
            <div style={s.name}>{user?.firstName} {user?.lastName}</div>
            <div style={s.email}>{user?.email}</div>
            {badge && (
              <span style={{ ...s.badge, background: badge.bg, color: badge.color }}>
                {user?.globalRole}
              </span>
            )}
          </div>
        </div>

        <div style={s.divider} />

        {/* ── Alertes ── */}
        {error   && <div style={s.alertErr}>{error}</div>}
        {success && <div style={s.alertOk}>✅ Profil mis à jour avec succès !</div>}

        {/* ── Champs ── */}
        <div style={s.grid}>
          <div style={s.field}>
            <label style={s.label}>Prénom</label>
            {editing
              ? <input style={s.input} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
              : <div style={s.value}>{user?.firstName || "—"}</div>}
          </div>
          <div style={s.field}>
            <label style={s.label}>Nom</label>
            {editing
              ? <input style={s.input} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              : <div style={s.value}>{user?.lastName || "—"}</div>}
          </div>
          <div style={{ ...s.field, gridColumn: "1 / -1" }}>
            <label style={s.label}>Email</label>
            {editing
              ? <input style={s.input} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              : <div style={s.value}>{user?.email || "—"}</div>}
          </div>
          <div style={s.field}>
            <label style={s.label}>Statut</label>
            <span style={user?.active ? s.badgeActive : s.badgeInactive}>
              {user?.active ? "Actif" : "Inactif"}
            </span>
          </div>
          <div style={s.field}>
            <label style={s.label}>Membre depuis</label>
            <div style={s.value}>
              {user?.dateCreation
                ? new Date(user.dateCreation).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
                : "—"}
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Dernière connexion</label>
            <div style={s.value}>
              {user?.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
                : "—"}
            </div>
          </div>
        </div>

        <div style={s.divider} />

        {/* ── Boutons ── */}
        <div style={s.actions}>
          {editing ? (
            <>
              <button style={s.btnSave} onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement..." : "💾 Enregistrer"}
              </button>
              <button style={s.btnCancel} onClick={() => { setEditing(false); setError(null); }}>
                Annuler
              </button>
            </>
          ) : (
            <>
              <button style={s.btnEdit} onClick={() => setEditing(true)}>
                ✏️ Modifier mon profil
              </button>
              <button style={s.btnPwd} onClick={() => navigate("/forgot-password")}>
                🔐 Changer mot de passe
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:         { minHeight: "100vh", background: "#f1f5f9", padding: "24px 16px", fontFamily: "'Inter', system-ui, sans-serif" },
  back:         { background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14, marginBottom: 20, padding: 0 },
  card:         { maxWidth: 640, margin: "0 auto", background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" },
  header:       { display: "flex", alignItems: "center", gap: 20, marginBottom: 24 },
  avatar:       { width: 64, height: 64, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0 },
  name:         { fontSize: 20, fontWeight: 700, color: "#0f172a" },
  email:        { fontSize: 14, color: "#64748b", marginTop: 3 },
  badge:        { display: "inline-block", marginTop: 6, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  divider:      { height: 1, background: "#f1f5f9", margin: "20px 0" },
  alertErr:     { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14 },
  alertOk:      { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14 },
  grid:         { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" },
  field:        { display: "flex", flexDirection: "column", gap: 6 },
  label:        { fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" },
  value:        { fontSize: 15, color: "#0f172a", fontWeight: 500 },
  input:        { fontSize: 15, color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 12px", outline: "none", background: "#f8fafc" },
  badgeActive:  { display: "inline-block", padding: "3px 10px", borderRadius: 99, background: "#dcfce7", color: "#16a34a", fontSize: 12, fontWeight: 600 },
  badgeInactive:{ display: "inline-block", padding: "3px 10px", borderRadius: 99, background: "#f1f5f9", color: "#94a3b8", fontSize: 12, fontWeight: 600 },
  actions:      { display: "flex", gap: 10, flexWrap: "wrap" },
  btnEdit:      { background: "#1d4ed8", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnPwd:       { background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnSave:      { background: "#16a34a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnCancel:    { background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  msg:          { textAlign: "center", marginTop: "4rem", fontSize: 15, color: "#64748b" },
};