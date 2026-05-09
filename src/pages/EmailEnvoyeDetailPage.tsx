import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEmailById, deleteEmail } from "../api/emailEnvoyeService";
import type { EmailEnvoyeDto } from "../types/emailEnvoye";

const EmailDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState<EmailEnvoyeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const data = await getEmailById(Number(id));
        setEmail(data);
      } catch {
        setError("Email introuvable.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEmail();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Supprimer cet email ?")) return;
    try {
      await deleteEmail(Number(id));
      navigate("/emails-envoyes");
    } catch {
      setError("Erreur lors de la suppression.");
    }
  };

  if (loading) return <div style={{ padding: 32, color: "#64748b" }}>Chargement...</div>;
  if (error)   return <div style={{ padding: 32, color: "#dc2626" }}>{error}</div>;
  if (!email)  return null;

  const isSucces = email.statutEnvoi === "SUCCES";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#0f172a" }}>
          📧 Email #{email.id}
        </h2>
        <button
          onClick={() => navigate("/emails-envoyes")}
          style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}
        >
          ← Retour
        </button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>

          <Row label="👤 Expéditeur"  value={email.nomExpediteur || "—"} />
          <Row label="📧 Destinataire" value={email.destinataire} />
          <Row label="📝 Sujet"        value={email.sujet} />
          <Row label="🏢 Association"  value={email.associationId ? `#${email.associationId}` : "—"} />
          <Row label="📅 Date"         value={email.dateEnvoi ? new Date(email.dateEnvoi).toLocaleString("fr-FR") : "—"} />

          {/* STATUT */}
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#374151", minWidth: 140 }}>📊 Statut</span>
            {email.statutEnvoi ? (
              <span style={{
                padding: "2px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                background: isSucces ? "#f0fdf4" : "#fef2f2",
                color:      isSucces ? "#16a34a" : "#dc2626",
                border:     `1px solid ${isSucces ? "#bbf7d0" : "#fecaca"}`,
              }}>
                {isSucces ? "✅ Succès" : "❌ Échec"}
              </span>
            ) : <span style={{ color: "#94a3b8" }}>—</span>}
          </div>

          {/* CONTENU */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>💬 Contenu</span>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", fontSize: 14, color: "#1e293b", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {email.contenu || <span style={{ color: "#94a3b8" }}>Aucun contenu</span>}
            </div>
          </div>

        </div>

        <div style={{ padding: "16px 28px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleDelete}
            style={{ padding: "10px 20px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
          >
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: "flex", gap: 16 }}>
    <span style={{ fontSize: 14, fontWeight: 600, color: "#374151", minWidth: 140 }}>{label}</span>
    <span style={{ fontSize: 14, color: "#1e293b" }}>{value}</span>
  </div>
);

export default EmailDetailPage;