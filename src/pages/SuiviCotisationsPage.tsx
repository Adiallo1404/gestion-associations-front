import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getMembresNonCotisants,
  getSuiviCotisations,
} from "../api/cotisationService";
import { getAssociations } from "../api/associationService";
import type { MembreCotisationStatus } from "../types/cotisation";

type Onglet = "tous" | "non-cotisants";

const STATUT_LABELS: Record<string, string> = {
  PAYEE: "✅ Payée",
  EN_ATTENTE: "⏳ En attente",
  EN_RETARD: "🔴 En retard",
  ANNULEE: "⚫ Annulée",
};

const STATUT_COLORS: Record<string, { background: string; color: string }> = {
  PAYEE: { background: "#dcfce7", color: "#15803d" },
  EN_ATTENTE: { background: "#fef9c3", color: "#92400e" },
  EN_RETARD: { background: "#fee2e2", color: "#dc2626" },
  ANNULEE: { background: "#f3f4f6", color: "#6b7280" },
};

const getCurrentMonthRange = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();

  return {
    debut: `${year}-${month}-01`,
    fin: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
};

const formatMoney = (amount?: number | null, devise?: string | null) => {
  if (amount == null) return "—";

  return `${Number(amount).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${devise ?? "€"}`;
};

export default function SuiviCotisationsPage() {
  const { associationId } = useParams<{ associationId: string }>();
  const navigate = useNavigate();

  const defaultRange = useMemo(() => getCurrentMonthRange(), []);

  const [onglet, setOnglet] = useState<Onglet>("tous");
  const [membres, setMembres] = useState<MembreCotisationStatus[]>([]);
  const [assocName, setAssocName] = useState("");
  const [debut, setDebut] = useState(defaultRange.debut);
  const [fin, setFin] = useState(defaultRange.fin);
  const [rechercheMembre, setRechercheMembre] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isAssociationLoading, setIsAssociationLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parsedAssociationId = Number(associationId);

  const loadAssociationName = useCallback(async () => {
    if (!associationId || Number.isNaN(parsedAssociationId)) {
      setAssocName("Association inconnue");
      setIsAssociationLoading(false);
      return;
    }

    try {
      setIsAssociationLoading(true);

      const response = await getAssociations({}, 0, 1000);
      const found = (response.content ?? []).find(
        (association) => association.id === parsedAssociationId
      );

      setAssocName(found?.name ?? `Association #${parsedAssociationId}`);
    } catch (loadError) {
      console.error("Failed to load association name", loadError);
      setAssocName(`Association #${parsedAssociationId}`);
    } finally {
      setIsAssociationLoading(false);
    }
  }, [associationId, parsedAssociationId]);

  const loadCotisationTracking = useCallback(async () => {
    if (
      !associationId ||
      Number.isNaN(parsedAssociationId) ||
      !debut ||
      !fin
    ) {
      return;
    }

    if (debut > fin) {
      setError("La date de début doit être avant la date de fin.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data =
        onglet === "tous"
          ? await getSuiviCotisations(parsedAssociationId, debut, fin)
          : await getMembresNonCotisants(parsedAssociationId, debut, fin);

      setMembres(data ?? []);
    } catch (loadError) {
      console.error("Failed to load cotisation tracking", loadError);
      setError("Erreur lors du chargement du suivi des cotisations.");
      setMembres([]);
    } finally {
      setIsLoading(false);
    }
  }, [associationId, parsedAssociationId, debut, fin, onglet]);

  useEffect(() => {
    loadAssociationName();
  }, [loadAssociationName]);

  useEffect(() => {
    loadCotisationTracking();
  }, [loadCotisationTracking]);

  const membresFiltres = useMemo(() => {
    const query = rechercheMembre.trim().toLowerCase();

    if (!query) return membres;

    return membres.filter((membre) => {
      const fullName = `${membre.firstName ?? ""} ${
        membre.lastName ?? ""
      }`.toLowerCase();

      const reverseName = `${membre.lastName ?? ""} ${
        membre.firstName ?? ""
      }`.toLowerCase();

      const email = `${membre.email ?? ""}`.toLowerCase();

      return (
        fullName.includes(query) ||
        reverseName.includes(query) ||
        email.includes(query)
      );
    });
  }, [membres, rechercheMembre]);

  const stats = useMemo(() => {
    const total = membresFiltres.length;
    const payes = membresFiltres.filter((membre) => membre.aCotise).length;
    const enRetard = membresFiltres.filter((membre) => membre.enRetard).length;
    const enAttente = membresFiltres.filter(
      (membre) => !membre.aCotise && !membre.enRetard
    ).length;

    return {
      total,
      payes,
      enRetard,
      enAttente,
    };
  }, [membresFiltres]);

  const filtreActif = rechercheMembre.trim().length > 0;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              📋 Suivi des cotisations —{" "}
              {isAssociationLoading ? "Chargement..." : assocName}
            </h1>

            <p style={styles.subtitle}>
              Analyse des cotisations sur une période donnée.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            style={styles.backButton}
          >
            ← Retour
          </button>
        </div>

        <section style={styles.filterCard}>
          <div style={styles.field}>
            <label style={styles.label}>Début de période</label>
            <input
              type="date"
              value={debut}
              onChange={(event) => setDebut(event.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Fin de période</label>
            <input
              type="date"
              value={fin}
              onChange={(event) => setFin(event.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.separator} />

          <div style={{ ...styles.field, flex: 1, minWidth: 220 }}>
            <label style={styles.label}>Rechercher un membre</label>

            <div style={styles.searchWrapper}>
              <span style={styles.searchIcon}>🔍</span>

              <input
                type="text"
                placeholder="Nom, prénom ou email..."
                value={rechercheMembre}
                onChange={(event) => setRechercheMembre(event.target.value)}
                style={styles.searchInput}
              />

              {filtreActif && (
                <button
                  type="button"
                  onClick={() => setRechercheMembre("")}
                  style={styles.clearSearchButton}
                  title="Effacer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </section>

        {filtreActif && (
          <div style={styles.activeFilter}>
            <span>Résultats pour :</span>
            <strong style={styles.activeFilterBadge}>
              "{rechercheMembre}"
            </strong>
            <span>
              {stats.total} membre{stats.total > 1 ? "s" : ""} trouvé
              {stats.total > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {onglet === "tous" && (
          <div style={styles.statsGrid}>
            <StatCard
              label="Total membres"
              value={stats.total}
              background="#f0f9ff"
              color="#0369a1"
            />

            <StatCard
              label="Cotisé"
              value={stats.payes}
              background="#dcfce7"
              color="#15803d"
              icon="✅"
            />

            <StatCard
              label="En attente"
              value={stats.enAttente}
              background="#fef9c3"
              color="#92400e"
              icon="⏳"
            />

            <StatCard
              label="En retard"
              value={stats.enRetard}
              background="#fee2e2"
              color="#dc2626"
              icon="🔴"
            />
          </div>
        )}

        <div style={styles.tabs}>
          <button
            type="button"
            onClick={() => setOnglet("tous")}
            style={onglet === "tous" ? styles.tabActive : styles.tab}
          >
            👥 Tous les membres
          </button>

          <button
            type="button"
            onClick={() => setOnglet("non-cotisants")}
            style={onglet === "non-cotisants" ? styles.tabActive : styles.tab}
          >
            ⚠️ Non cotisants
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {isLoading ? (
          <div style={styles.stateBox}>Chargement...</div>
        ) : (
          <div style={styles.tableCard}>
            {membresFiltres.length === 0 ? (
              <div style={styles.stateBox}>
                {filtreActif
                  ? `Aucun membre ne correspond à "${rechercheMembre}".`
                  : onglet === "non-cotisants"
                  ? "✅ Tous les membres ont cotisé !"
                  : "Aucun membre trouvé."}
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={styles.th}>Membre</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Téléphone</th>
                    <th style={styles.th}>Statut</th>
                    <th style={styles.th}>Montant</th>
                    <th style={styles.th}>Échéance</th>
                    <th style={styles.th}>Référence</th>
                  </tr>
                </thead>

                <tbody>
                  {membresFiltres.map((membre, index) => {
                    const statut = membre.statut ?? "EN_RETARD";
                    const statutStyle =
                      STATUT_COLORS[statut] ?? STATUT_COLORS.EN_RETARD;

                    return (
                      <tr
                        key={membre.memberId}
                        style={{
                          ...styles.tableRow,
                          background: index % 2 === 0 ? "#fff" : "#fafafa",
                        }}
                      >
                        <td style={styles.tdStrong}>
                          {membre.firstName} {membre.lastName}
                        </td>

                        <td style={styles.tdMuted}>{membre.email ?? "—"}</td>

                        <td style={styles.tdMuted}>{membre.phone ?? "—"}</td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              background: statutStyle.background,
                              color: statutStyle.color,
                            }}
                          >
                            {membre.statut
                              ? STATUT_LABELS[membre.statut] ?? membre.statut
                              : "❌ Aucune cotisation"}
                          </span>
                        </td>

                        <td style={styles.td}>
                          {formatMoney(membre.montant, membre.devise)}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            color: membre.enRetard ? "#dc2626" : "#6b7280",
                            fontWeight: membre.enRetard ? 700 : 400,
                          }}
                        >
                          {membre.dateEcheance ?? "—"}
                        </td>

                        <td style={styles.tdMuted}>
                          {membre.referencePaiement ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  background,
  color,
  icon,
}: {
  label: string;
  value: number;
  background: string;
  color: string;
  icon?: string;
}) {
  return (
    <div style={{ ...styles.statCard, background }}>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>
        {icon ? `${icon} ` : ""}
        {label}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "32px 16px",
    fontFamily: "system-ui, sans-serif",
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#111827",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 14,
    color: "#6b7280",
  },
  backButton: {
    padding: "8px 16px",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
  },
  filterCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 20,
    display: "flex",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  field: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 5,
    fontWeight: 600,
  },
  input: {
    padding: "9px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    color: "#111827",
    background: "#fff",
  },
  separator: {
    width: 1,
    height: 38,
    background: "#e5e7eb",
  },
  searchWrapper: {
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    fontSize: 16,
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "9px 36px 9px 34px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
  },
  clearSearchButton: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    fontSize: 16,
  },
  activeFilter: {
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#6b7280",
  },
  activeFilterBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "3px 10px",
    borderRadius: 999,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    borderRadius: 12,
    padding: "16px 18px",
    textAlign: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: 800,
  },
  statLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 3,
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    padding: "8px 18px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
  },
  tabActive: {
    padding: "8px 18px",
    borderRadius: 8,
    border: "1px solid #3b82f6",
    background: "#3b82f6",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#dc2626",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 16,
  },
  tableCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeadRow: {
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: 13,
    fontWeight: 700,
    color: "#6b7280",
  },
  tableRow: {
    borderBottom: "1px solid #f3f4f6",
  },
  td: {
    padding: "12px 16px",
    fontSize: 14,
    color: "#111827",
  },
  tdStrong: {
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },
  tdMuted: {
    padding: "12px 16px",
    fontSize: 13,
    color: "#6b7280",
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  stateBox: {
    textAlign: "center",
    padding: 48,
    color: "#6b7280",
    fontSize: 15,
  },
};