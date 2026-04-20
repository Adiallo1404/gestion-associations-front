import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { notificationService } from "../api/notificationService";
import type { NotificationDto } from "../types/notification";

const TYPE_LABELS: Record<string, string> = {
  RELANCE_COTISATION: "Relance cotisation",
  COTISATION_PAYEE: "Cotisation payée",
  NOUVEAU_MEMBRE: "Nouveau membre",
  CHANGEMENT_STATUT: "Changement statut",
  DOCUMENT_PARTAGE: "Document partagé",
  RAPPEL_ECHEANCE: "Rappel échéance",
  INFORMATION_GENERALE: "Information générale",
};

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [notif, setNotif] = useState<NotificationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotif = async () => {
      try {
        const data = await notificationService.getById(Number(id));
        setNotif(data);
        // ✅ FIX : markAsRead dans un try/catch séparé
        // pour ne pas bloquer l'affichage si ça échoue
        if (data.statut === "NON_LUE") {
          try {
            await notificationService.markAsRead(Number(id));
            setNotif({ ...data, statut: "LUE" });
          } catch {
            console.warn("markAsRead a échoué — notification affichée quand même");
          }
        }
      } catch {
        setError("Notification introuvable.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchNotif();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Supprimer cette notification ?")) return;
    try {
      await notificationService.delete(Number(id));
      // ✅ FIX : window.location.href au lieu de navigate
      window.location.href = "/notifications";
    } catch {
      setError("Erreur lors de la suppression.");
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 64, color: "#6b7280" }}>
      Chargement...
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 16 }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "12px 16px" }}>
        {error}
      </div>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          onClick={() => window.location.href = "/notifications"}
          style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
          ← Retour aux notifications
        </button>
      </div>
    </div>
  );

  if (!notif) return null;

  const rows = [
    { label: "Type",         value: TYPE_LABELS[notif.typeNotification] || notif.typeNotification },
    { label: "Statut",       value: notif.statut },
    { label: "Association",  value: notif.associationId ?? "—" },
    { label: "Destinataire", value: notif.destinataireId ?? "—" },
    { label: "Membre",       value: notif.memberId ?? "—" },
    { label: "Lien action",  value: notif.lienAction || "—" },
    { label: "Email envoyé", value: notif.envoyeeParEmail ? "Oui" : "Non" },
    { label: "Date lecture",
      value: notif.dateLecture
        ? new Date(notif.dateLecture).toLocaleString("fr-FR")
        : "—" },
    { label: "Expiration",
      value: notif.dateExpiration
        ? new Date(notif.dateExpiration).toLocaleString("fr-FR")
        : "—" },
    { label: "Date création",
      value: notif.dateCreation
        ? new Date(notif.dateCreation).toLocaleString("fr-FR")
        : "—" },
  ];

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 16px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>🔔 {notif.titre}</h2>
        {/* ✅ FIX : window.location.href au lieu de navigate */}
        <button
          onClick={() => window.location.href = "/notifications"}
          style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
          ← Retour
        </button>
      </div>

      {/* CARTE DÉTAIL */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: 24 }}>

          {/* STATUT BADGE en haut */}
          <div style={{ marginBottom: 16 }}>
            <span style={{
              background: notif.statut === "NON_LUE" ? "#eff6ff"
                        : notif.statut === "LUE"     ? "#f0fdf4"
                        : "#f9fafb",
              color:     notif.statut === "NON_LUE" ? "#1d4ed8"
                        : notif.statut === "LUE"     ? "#15803d"
                        : "#6b7280",
              border: `1px solid ${
                notif.statut === "NON_LUE" ? "#bfdbfe"
                : notif.statut === "LUE"   ? "#bbf7d0"
                : "#e5e7eb"}`,
              padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600
            }}>
              {notif.statut === "NON_LUE" ? "● Non lue"
               : notif.statut === "LUE"   ? "✓ Lue"
               : "Archivée"}
            </span>
          </div>

          {/* LIGNES */}
          {rows.map(({ label, value }) => (
            <div key={label} style={{ display: "flex", borderBottom: "1px solid #f3f4f6", padding: "12px 0" }}>
              <span style={{ width: 160, color: "#6b7280", fontSize: 14, fontWeight: 500, flexShrink: 0 }}>
                {label}
              </span>
              <span style={{ fontSize: 14, color: "#111827" }}>{String(value)}</span>
            </div>
          ))}

          {/* MESSAGE */}
          <div style={{ display: "flex", paddingTop: 12 }}>
            <span style={{ width: 160, color: "#6b7280", fontSize: 14, fontWeight: 500, flexShrink: 0 }}>
              Message
            </span>
            <div style={{
              flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb",
              borderRadius: 8, padding: "12px 16px", fontSize: 14,
              lineHeight: 1.6, whiteSpace: "pre-wrap", minHeight: 80
            }}>
              {notif.message || "Aucun message"}
            </div>
          </div>
        </div>

        {/* FOOTER BOUTON SUPPRIMER */}
        <div style={{ padding: "16px 24px", background: "#f9fafb", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleDelete}
            style={{ padding: "10px 20px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}