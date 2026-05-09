import { useEffect, useState } from "react";
import { getCotisations, deleteCotisation } from "../api/cotisationService";
import { useNavigate } from "react-router-dom";
import type { Cotisation } from "../types/cotisation";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize";

const STATUT_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  EN_ATTENTE: {
    label: "En attente",
    color: "#92400e",
    bg: "#fef3c7",
  },
  PAYEE: {
    label: "Payée",
    color: "#065f46",
    bg: "#d1fae5",
  },
  EN_RETARD: {
    label: "En retard",
    color: "#991b1b",
    bg: "#fee2e2",
  },
  ANNULEE: {
    label: "Annulée",
    color: "#374151",
    bg: "#f3f4f6",
  },
};

const getDeviseSymbol = (devise?: string) => {
  switch (devise) {
    case "XAF":
    case "XOF":
      return "FCFA";
    case "USD":
      return "$";
    case "GBP":
      return "£";
    case "CHF":
      return "CHF";
    case "GNF":
      return "GNF";
    case "MAD":
      return "MAD";
    case "DZD":
      return "DZD";
    case "TND":
      return "TND";
    default:
      return "€";
  }
};

export default function CotisationListPage() {
  const [cotisations, setCotisations] = useState<Cotisation[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [page, setPage] = useState(0);

  const navigate = useNavigate();

  const { isMobile, isTablet } = useWindowSize();

  const [modal, setModal] = useState<{
    isOpen: boolean;
    id: number | null;
    label: string;
  }>({
    isOpen: false,
    id: null,
    label: "",
  });

  const fetchData = async () => {
    try {
      const data = await getCotisations(filters, page);
      setCotisations(data.content);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, page]);

  const handleDeleteClick = (c: Cotisation) =>
    setModal({
      isOpen: true,
      id: c.id!,
      label: `cotisation de ${c.montant} ${getDeviseSymbol(
        c.devise
      )} (${STATUT_META[c.statut]?.label || c.statut})`,
    });

  const handleConfirmDelete = async () => {
    if (!modal.id) return;

    try {
      await deleteCotisation(modal.id);

      setModal({
        isOpen: false,
        id: null,
        label: "",
      });

      fetchData();
    } catch {
      setModal({
        isOpen: false,
        id: null,
        label: "",
      });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        padding: isMobile ? "16px" : "28px 32px",
      }}
    >
      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer la cotisation"
        message={`Êtes-vous sûr de vouloir supprimer la ${modal.label} ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setModal({
            isOpen: false,
            id: null,
            label: "",
          })
        }
      />

      {/* ✅ BREADCRUMB */}
      <nav style={breadcrumbStyle}>
        <span
          style={breadcrumbHome}
          onClick={() => navigate("/")}
        >
          🏠 Accueil
        </span>

        <span style={breadcrumbSeparator}>›</span>

        <span style={breadcrumbCurrent}>
          Cotisations
        </span>
      </nav>

      {/* EN-TÊTE */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 20 : 26,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            💰 Cotisations
          </h1>

          <p
            style={{
              margin: "4px 0 0",
              fontSize: 14,
              color: "#6b7280",
            }}
          >
            Gérez et suivez toutes les cotisations
          </p>
        </div>

        <button
          onClick={() => navigate("/cotisations/new")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(29,78,216,0.3)",
          }}
        >
          + {isMobile ? "Ajouter" : "Nouvelle cotisation"}
        </button>
      </div>

      {/* FILTRES */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: "16px 20px",
          marginBottom: 20,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <select
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 13,
            color: "#374151",
            background: "#fff",
            cursor: "pointer",
          }}
          onChange={(e) => {
            setPage(0);

            setFilters({
              ...filters,
              statut: e.target.value || undefined,
            });
          }}
        >
          <option value="">Tous les statuts</option>

          {Object.entries(STATUT_META).map(([v, m]) => (
            <option key={v} value={v}>
              {m.label}
            </option>
          ))}
        </select>

        {!isMobile && (
          <>
            <input
              type="number"
              placeholder="Montant min"
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                width: 130,
              }}
              onChange={(e) => {
                setPage(0);

                setFilters({
                  ...filters,
                  montantMin: e.target.value || undefined,
                });
              }}
            />

            <input
              type="number"
              placeholder="Montant max"
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                width: 130,
              }}
              onChange={(e) => {
                setPage(0);

                setFilters({
                  ...filters,
                  montantMax: e.target.value || undefined,
                });
              }}
            />
          </>
        )}

        <button
          onClick={fetchData}
          style={{
            padding: "8px 16px",
            background: "#f1f5f9",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          🔍 Filtrer
        </button>
      </div>

      {/* MOBILE */}
      {isMobile ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {cotisations.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#9ca3af",
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  marginBottom: 12,
                }}
              >
                💸
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                }}
              >
                Aucune cotisation trouvée
              </p>
            </div>
          ) : (
            cotisations.map((c) => {
              const st = STATUT_META[c.statut] || {
                label: c.statut,
                color: "#374151",
                bg: "#f3f4f6",
              };

              return (
                <div
                  key={c.id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 16,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <strong
                      style={{
                        fontSize: 17,
                        color: "#0f172a",
                      }}
                    >
                      {c.montant} {getDeviseSymbol(c.devise)}
                    </strong>

                    <span
                      style={{
                        background: st.bg,
                        color: st.color,
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {st.label}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#94a3b8",
                      marginBottom: 12,
                    }}
                  >
                    Membre #{c.memberId} · {c.periodeDebut} →{" "}
                    {c.periodeFin}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    <button
                      style={btnViewStyle}
                      onClick={() =>
                        navigate(`/cotisations/${c.id}`)
                      }
                    >
                      👁️ Voir
                    </button>

                    <button
                      style={btnEditStyle}
                      onClick={() =>
                        navigate(`/cotisations/${c.id}/edit`)
                      }
                    >
                      ✏️ Modifier
                    </button>

                    <button
                      style={btnDelStyle}
                      onClick={() => handleDeleteClick(c)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        // DESKTOP/TABLET
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {[
                  "Membre",
                  "Montant",
                  "Statut",
                  ...(!isTablet
                    ? ["Période début", "Période fin"]
                    : []),
                  "Échéance",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {cotisations.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "48px",
                      color: "#9ca3af",
                      fontSize: 15,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 36,
                        marginBottom: 8,
                      }}
                    >
                      💸
                    </div>

                    Aucune cotisation trouvée
                  </td>
                </tr>
              )}

              {cotisations.map((c, i) => {
                const st = STATUT_META[c.statut] || {
                  label: c.statut,
                  color: "#374151",
                  bg: "#f3f4f6",
                };

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      background:
                        i % 2 === 0 ? "#fff" : "#fafafa",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "#f8faff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        i % 2 === 0 ? "#fff" : "#fafafa")
                    }
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#374151",
                      }}
                    >
                      #{c.memberId}
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: 14,
                          color: "#0f172a",
                        }}
                      >
                        {c.montant}{" "}
                        {getDeviseSymbol(c.devise)}
                      </strong>
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                      }}
                    >
                      <span
                        style={{
                          background: st.bg,
                          color: st.color,
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {st.label}
                      </span>
                    </td>

                    {!isTablet && (
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#6b7280",
                        }}
                      >
                        {c.periodeDebut || "—"}
                      </td>
                    )}

                    {!isTablet && (
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#6b7280",
                        }}
                      >
                        {c.periodeFin || "—"}
                      </td>
                    )}

                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        color: "#6b7280",
                      }}
                    >
                      {c.dateEcheance || "—"}
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                        }}
                      >
                        <button
                          style={btnViewStyle}
                          onClick={() =>
                            navigate(`/cotisations/${c.id}`)
                          }
                        >
                          👁️
                        </button>

                        <button
                          style={btnEditStyle}
                          onClick={() =>
                            navigate(
                              `/cotisations/${c.id}/edit`
                            )
                          }
                        >
                          ✏️
                        </button>

                        <button
                          style={btnDelStyle}
                          onClick={() =>
                            handleDeleteClick(c)
                          }
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          marginTop: 24,
        }}
      >
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: page === 0 ? "#f9fafb" : "#fff",
            color: page === 0 ? "#9ca3af" : "#374151",
            cursor:
              page === 0 ? "not-allowed" : "pointer",
            fontSize: 13,
          }}
        >
          ← Précédent
        </button>

        <span
          style={{
            fontSize: 14,
            color: "#6b7280",
            fontWeight: 500,
          }}
        >
          Page {page + 1}
        </span>

        <button
          onClick={() => setPage(page + 1)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
            color: "#374151",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}

const breadcrumbStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 20,
  fontSize: 14,
};

const breadcrumbHome: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#6b7280",
  cursor: "pointer",
  fontWeight: 500,
};

const breadcrumbSeparator: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: 16,
};

const breadcrumbCurrent: React.CSSProperties = {
  color: "#111827",
  fontWeight: 600,
};

const btnViewStyle: React.CSSProperties = {
  background: "#eff6ff",
  color: "#1d4ed8",
  border: "none",
  padding: "6px 10px",
  borderRadius: 7,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
};

const btnEditStyle: React.CSSProperties = {
  background: "#f0fdf4",
  color: "#16a34a",
  border: "none",
  padding: "6px 10px",
  borderRadius: 7,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
};

const btnDelStyle: React.CSSProperties = {
  background: "#fef2f2",
  color: "#dc2626",
  border: "none",
  padding: "6px 10px",
  borderRadius: 7,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
};