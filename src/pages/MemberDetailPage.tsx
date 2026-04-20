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

  if (loading) return <div style={{ textAlign: "center", padding: 64, color: "#6b7280" }}>Chargement...</div>;
  if (error) return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 16 }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "12px 16px" }}>{error}</div>
    </div>
  );
  if (!email) return null;

  const rows = [
    { label: "Destinataire", value: email.destinataire },
    { label: "Sujet", value: email.sujet },
    { label: "Association", value: email.associationId ?? "—" },
    { label: "Date d'envoi", value: email.dateEnvoi ? new Date(email.dateEnvoi).toLocaleString("fr-FR") : "—" },
  ];

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 16px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Email #{email.id}</h2>
        <button
          onClick={() => navigate("/emails-envoyes")}
          style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}
        >
          ← Retour
        </button>
      </div>

      {/* CARD */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: 24 }}>

          {/* CHAMPS */}
          {rows.map(({ label, value }) => (
            <div key={label} style={{ display: "flex", borderBottom: "1px solid #f3f4f6", padding: "12px 0" }}>
              <span style={{ width: 160, color: "#6b7280", fontSize: 14, fontWeight: 500, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 14, color: "#111827" }}>{String(value)}</span>
            </div>
          ))}

          {/* CONTENU */}
          <div style={{ display: "flex", paddingTop: 12 }}>
            <span style={{ width: 160, color: "#6b7280", fontSize: 14, fontWeight: 500, flexShrink: 0 }}>Contenu</span>
            <div style={{ flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", minHeight: 80, color: email.contenu ? "#111827" : "#9ca3af" }}>
              {email.contenu || "Aucun contenu"}
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div style={{ padding: "16px 24px", background: "#f9fafb", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleDelete}
            style={{ padding: "10px 20px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
          >
            Supprimer
          </button>
        </div>
      </div>

    </div>
  );
};

export default EmailDetailPage;