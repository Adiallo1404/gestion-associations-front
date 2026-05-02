import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMemberHistories,
  deleteMemberHistory,
} from "../api/memberHistoryService";
import type { MemberHistory } from "../api/memberHistoryService";
import { StatutMembreLabels } from "../types/memberHistory";

export default function MemberHistoryListPage() {
  const [histories, setHistories] = useState<MemberHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getMemberHistories({ page: 0, size: 100 });
      setHistories(data.content || []);
    } catch {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm("Supprimer cet historique ?")) return;
    try {
      await deleteMemberHistory(id);
      fetchData();
    } catch {
      setError("Erreur lors de la suppression");
    }
  };

  const filtered = histories.filter((h) =>
    (h.motif || "").toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (raw?: string) => {
    if (!raw) return "—";
    const d = new Date(raw);
    return (
      d.toLocaleDateString("fr-FR") +
      " " +
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  if (loading) return <p style={styles.message}>Chargement...</p>;
  if (error) return <p style={{ ...styles.message, color: "#A32D2D" }}>{error}</p>;

  return (
    <div style={styles.page}>

      {/* ✅ Bouton retour tableau de bord */}
      <button style={styles.btnBack} onClick={() => navigate("/")}>
        ← Tableau de bord
      </button>

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>Historique des membres</h1>
        <button
          style={styles.btnCreate}
          onClick={() => navigate("/member-histories/new")}
        >
          ➕ Créer
        </button>
      </div>

      {/* TOOLBAR */}
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Rechercher par motif..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <span style={styles.countLabel}>
          {filtered.length} élément{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p style={styles.message}>Aucun historique trouvé.</p>
      ) : (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Ancien</th>
                <th style={styles.th}>Nouveau</th>
                <th style={styles.th}>Motif</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h.id} style={styles.tr}>
                  <td style={styles.td}>{h.id}</td>
                  <td style={styles.td}>
                    {h.ancienStatut ? StatutMembreLabels[h.ancienStatut] : "Création"}
                  </td>
                  <td style={styles.td}>
                    {StatutMembreLabels[h.nouveauStatut]}
                  </td>
                  <td style={styles.td}>{h.motif || "—"}</td>
                  <td style={styles.td}>{formatDate(h.dateChangement)}</td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={styles.btnVoir}
                        onClick={() => navigate(`/member-histories/${h.id}`)}
                      >
                        Voir
                      </button>
                      <button
                        style={styles.btnDel}
                        onClick={() => handleDelete(h.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1000,
    margin: "0 auto",
    padding: 20,
  },
  // ✅ Nouveau style bouton retour
  btnBack: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    background: "none",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: 14,
    padding: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  searchInput: {
    padding: 8,
    border: "1px solid #ccc",
    borderRadius: 6,
  },
  countLabel: {
    color: "#6b7280",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 10,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  theadRow: {
    background: "#f9fafb",
  },
  th: {
    textAlign: "left" as const,
    padding: 10,
    borderBottom: "1px solid #e5e7eb",
  },
  tr: {
    borderBottom: "1px solid #f3f4f6",
  },
  td: {
    padding: 10,
  },
  actions: {
    display: "flex",
    gap: 8,
  },
  btnVoir: {
    padding: "6px 10px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  btnDel: {
    padding: "6px 10px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  btnCreate: {
    padding: "8px 16px",
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  message: {
    textAlign: "center" as const,
    marginTop: 20,
  },
};