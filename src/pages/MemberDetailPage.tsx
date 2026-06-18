import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { memberService } from "../api/memberService";
import type { Member } from "../types/member";

interface DetailRow {
  label: string;
  value: string | number;
}

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memberId = Number(id);

  const fetchMember = useCallback(async () => {
    if (!id || Number.isNaN(memberId)) {
      setError("Identifiant membre invalide.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await memberService.getById(memberId);
      setMember(data);
    } catch (err) {
      console.error("Failed to load member details", err);
      setError("Membre introuvable.");
    } finally {
      setIsLoading(false);
    }
  }, [id, memberId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const handleDelete = async () => {
    if (!member?.id) return;

    const confirmed = window.confirm(
      `Supprimer le membre "${member.firstName} ${member.lastName}" ?`
    );

    if (!confirmed) return;

    try {
      await memberService.remove(member.id);
      navigate("/members");
    } catch (err) {
      console.error("Failed to delete member", err);
      setError("Erreur lors de la suppression du membre.");
    }
  };

  const rows = useMemo<DetailRow[]>(() => {
    if (!member) return [];

    return [
      {
        label: "Prénom",
        value: member.firstName || "—",
      },
      {
        label: "Nom",
        value: member.lastName || "—",
      },
      {
        label: "Email",
        value: member.email || "—",
      },
      {
        label: "Téléphone",
        value: member.phone || "—",
      },
      {
        label: "Adresse",
        value: member.address || "—",
      },
      {
        label: "Adresse postale",
        value: member.postalAddress || "—",
      },
      {
        label: "Association",
        value: member.associationName || member.associationId || "—",
      },
      {
        label: "Statut",
        value: member.active ? "Actif" : "Inactif",
      },
      {
        label: "Date d'adhésion",
        value: member.membershipDate
          ? new Date(member.membershipDate).toLocaleString("fr-FR")
          : "—",
      },
    ];
  }, [member]);

  if (isLoading) {
    return <div style={loadingStyle}>Chargement...</div>;
  }

  if (error) {
    return (
      <div style={errorContainerStyle}>
        <div style={errorBoxStyle}>{error}</div>

        <button style={backButtonStyle} onClick={() => navigate("/members")}>
          ← Retour
        </button>
      </div>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          {member.firstName} {member.lastName}
        </h2>

        <button style={backButtonStyle} onClick={() => navigate("/members")}>
          ← Retour
        </button>
      </div>

      <div style={cardStyle}>
        <div style={cardBodyStyle}>
          {rows.map(({ label, value }) => (
            <div key={label} style={rowStyle}>
              <span style={rowLabelStyle}>{label}</span>
              <span style={rowValueStyle}>{String(value)}</span>
            </div>
          ))}
        </div>

        <div style={footerStyle}>
          <button
            style={editButtonStyle}
            onClick={() => navigate(`/members/${member.id}/edit`)}
          >
            Modifier
          </button>

          <button style={deleteButtonStyle} onClick={handleDelete}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: 700,
  margin: "0 auto",
  padding: "32px 16px",
};

const loadingStyle: React.CSSProperties = {
  textAlign: "center",
  padding: 64,
  color: "#6b7280",
};

const errorContainerStyle: React.CSSProperties = {
  maxWidth: 600,
  margin: "40px auto",
  padding: 16,
};

const errorBoxStyle: React.CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#dc2626",
  borderRadius: 8,
  padding: "12px 16px",
  marginBottom: 16,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
  gap: 16,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
};

const backButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  overflow: "hidden",
};

const cardBodyStyle: React.CSSProperties = {
  padding: 24,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  borderBottom: "1px solid #f3f4f6",
  padding: "12px 0",
};

const rowLabelStyle: React.CSSProperties = {
  width: 160,
  color: "#6b7280",
  fontSize: 14,
  fontWeight: 500,
  flexShrink: 0,
};

const rowValueStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#111827",
};

const footerStyle: React.CSSProperties = {
  padding: "16px 24px",
  background: "#f9fafb",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
};

const editButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
};

const deleteButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
};