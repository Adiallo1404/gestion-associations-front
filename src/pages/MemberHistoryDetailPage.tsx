import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMemberHistoryById } from "../api/memberHistoryService";
import { memberService } from "../api/memberService";
import { getAssociations } from "../api/associationService";
import { getUsers } from "../api/userService";
import type { MemberHistory } from "../api/memberHistoryService";
import { StatutMembreLabels } from "../types/memberHistory";

export default function MemberHistoryDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<MemberHistory | null>(null);
  const [memberName, setMemberName] = useState("");
  const [associationName, setAssociationName] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;

        const history = await getMemberHistoryById(Number(id));
        setData(history);

        const membersRes = await memberService.getAll({ page: 0, size: 1000 });
        const m = membersRes.content.find((x: any) => x.id === history.memberId);
        setMemberName(m?.name || `Membre #${history.memberId}`);

        const assocRes = await getAssociations(0, 1000);
        const a = assocRes.content.find((x: any) => x.id === history.associationId);
        setAssociationName(a?.name || `Association #${history.associationId}`);

        if (history.modifieParId) {
          const usersRes = await getUsers(0, 1000);
          const u = usersRes.content.find((x: any) => x.id === history.modifieParId);
          // ✅ CORRIGÉ : firstName + lastName au lieu de username
          setUserName(
            u ? `${u.firstName} ${u.lastName}` : `User #${history.modifieParId}`
          );
        } else {
          setUserName("Système");
        }

      } catch {
        setError("Historique introuvable.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Supprimer cet historique ?")) return;
    try {
      const { deleteMemberHistory } = await import("../api/memberHistoryService");
      await deleteMemberHistory(Number(id));
      window.location.href = "/member-histories";
    } catch {
      setError("Erreur lors de la suppression.");
    }
  };

  if (loading)
    return <div style={{ textAlign: "center", padding: 64, color: "#6b7280" }}>Chargement...</div>;

  if (error)
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 16 }}>
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "12px 16px" }}>
          {error}
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={() => (window.location.href = "/member-histories")} style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8 }}>
            ← Retour
          </button>
        </div>
      </div>
    );

  if (!data) return null;

  const rows = [
    { label: "Membre", value: memberName },
    { label: "Association", value: associationName },
    { label: "Ancien statut", value: data.ancienStatut ? StatutMembreLabels[data.ancienStatut] : "Création" },
    { label: "Nouveau statut", value: StatutMembreLabels[data.nouveauStatut] },
    { label: "Motif", value: data.motif || "—" },
    { label: "Date", value: new Date(data.dateChangement!).toLocaleString() },
    { label: "Modifié par", value: userName },
  ];

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>📜 Historique #{data.id}</h2>
        <button onClick={() => (window.location.href = "/member-histories")} style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer" }}>
          ← Retour
        </button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: 24 }}>
          {rows.map(({ label, value }) => (
            <div key={label} style={{ display: "flex", borderBottom: "1px solid #f3f4f6", padding: "12px 0" }}>
              <span style={{ width: 200, color: "#6b7280", fontSize: 14, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 14, color: "#111827" }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 24px", background: "#f9fafb", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={handleDelete} style={{ padding: "10px 20px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}