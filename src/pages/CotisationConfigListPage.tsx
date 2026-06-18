import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { cotisationConfigService } from "../api/cotisationConfigService";
import { getAssociations } from "../api/associationService";
import type { Association } from "../types/association";
import type { CotisationConfigDto } from "../types/cotisationConfig";
import { PERIODICITE_LABELS } from "../types/cotisationConfig";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize";

interface DeleteModalState {
  isOpen: boolean;
  associationId: number | null;
  label: string;
}

/**
 * Displays cotisation configurations by association.
 * Each association can have at most one cotisation configuration.
 */
export default function CotisationConfigListPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();

  const [configs, setConfigs] = useState<CotisationConfigDto[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<DeleteModalState>({
    isOpen: false,
    associationId: null,
    label: "",
  });

  const associationMap = useMemo(() => {
    return new Map(
      associations.map((association) => [association.id, association.name])
    );
  }, [associations]);

  const getAssociationName = useCallback(
    (associationId: number): string => {
      return associationMap.get(associationId) ?? `Association #${associationId}`;
    },
    [associationMap]
  );

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const associationResponse = await getAssociations({}, 0, 1000);
      const associationList = associationResponse.content ?? [];

      setAssociations(associationList);

      const configResults = await Promise.all(
        associationList.map(async (association) => {
          try {
            return await cotisationConfigService.getCotisationConfigByAssociation(
              association.id
            );
          } catch {
            return null;
          }
        })
      );

      setConfigs(
        configResults
          .filter(
            (config): config is CotisationConfigDto => config !== null
          )
          .sort((firstConfig, secondConfig) => {
            const firstName =
              associationList.find(
                (association) => association.id === firstConfig.associationId
              )?.name ?? "";

            const secondName =
              associationList.find(
                (association) => association.id === secondConfig.associationId
              )?.name ?? "";

            return firstName.localeCompare(secondName, "fr");
          })
      );
    } catch (loadError) {
      console.error("Failed to load cotisation configurations", loadError);
      setConfigs([]);
      setAssociations([]);
      setError("Erreur lors du chargement des configurations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteClick = (
    associationId: number,
    event: MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();

    setModal({
      isOpen: true,
      associationId,
      label: getAssociationName(associationId),
    });
  };

  const handleConfirmDelete = async () => {
    if (modal.associationId === null) return;

    try {
      await cotisationConfigService.deleteCotisationConfig(
        modal.associationId
      );

      setModal({
        isOpen: false,
        associationId: null,
        label: "",
      });

      await fetchData();
    } catch (deleteError) {
      console.error("Failed to delete cotisation configuration", deleteError);
      setError("Erreur lors de la suppression de la configuration.");

      setModal({
        isOpen: false,
        associationId: null,
        label: "",
      });
    }
  };

  const handleCancelDelete = () => {
    setModal({
      isOpen: false,
      associationId: null,
      label: "",
    });
  };

  const formatCurrency = (value?: number | null): string => {
    return `${Number(value ?? 0).toFixed(2)} €`;
  };

  const statCards = useMemo(
    () => [
      {
        label: "Total",
        value: configs.length,
        color: "#111827",
        background: "#f9fafb",
      },
      {
        label: "Mensuelle",
        value: configs.filter((config) => config.periodicite === "MENSUELLE")
          .length,
        color: "#185FA5",
        background: "#E6F1FB",
      },
      {
        label: "Trimestrielle",
        value: configs.filter(
          (config) => config.periodicite === "TRIMESTRIELLE"
        ).length,
        color: "#3B6D11",
        background: "#EAF3DE",
      },
      {
        label: "Annuelle",
        value: configs.filter((config) => config.periodicite === "ANNUELLE")
          .length,
        color: "#b45309",
        background: "#fefce8",
      },
    ],
    [configs]
  );

  return (
    <div style={pageStyle(isMobile)}>
      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer la configuration"
        message={`Êtes-vous sûr de vouloir supprimer la configuration de "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Breadcrumb navigation */}
      <nav style={breadcrumbStyle}>
        <span style={breadcrumbHomeStyle} onClick={() => navigate("/")}>
          🏠 Accueil
        </span>

        <span style={breadcrumbSeparatorStyle}>›</span>

        <span style={breadcrumbCurrentStyle}>Configs cotisation</span>
      </nav>

      {/* Page header */}
      <div style={headerStyle}>
        <h2 style={titleStyle(isMobile)}>⚙️ Configs cotisation</h2>

        <button
          type="button"
          style={addButtonStyle}
          onClick={() => navigate("/cotisation-configs/new")}
        >
          {isMobile ? "➕" : "➕ Créer"}
        </button>
      </div>

      {/* Summary metrics */}
      <div style={statsGridStyle(isMobile)}>
        {statCards.map(({ label, value, color, background }) => (
          <div
            key={label}
            style={{
              ...statCardStyle(isMobile),
              background,
            }}
          >
            <div style={statLabelStyle}>{label}</div>

            <div
              style={{
                ...statValueStyle(isMobile),
                color,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {error && <div style={errorBannerStyle}>{error}</div>}

      {isLoading ? (
        <div style={loadingStyle}>Chargement...</div>
      ) : isMobile ? (
        <div style={mobileListStyle}>
          {configs.length === 0 ? (
            <p style={emptyStateStyle}>Aucune configuration trouvée</p>
          ) : (
            configs.map((config) => (
              <div
                key={config.id ?? config.associationId}
                style={mobileCardStyle}
                onClick={() =>
                  navigate(
                    `/cotisation-configs/association/${config.associationId}`
                  )
                }
              >
                <div style={mobileTitleStyle}>
                  {getAssociationName(config.associationId)}
                </div>

                <div style={mobileMetaStyle}>
                  <span style={amountStyle}>
                    {formatCurrency(config.montantDefaut)}
                  </span>

                  <span style={periodicityBadgeStyle}>
                    {PERIODICITE_LABELS[config.periodicite]}
                  </span>
                </div>

                <div style={mobileDetailsStyle}>
                  <span>
                    Jour limite :{" "}
                    {config.jourLimitePaiement
                      ? `Jour ${config.jourLimitePaiement}`
                      : "—"}
                  </span>

                  <span>
                    Rappel :{" "}
                    {config.delaiRappelJours
                      ? `${config.delaiRappelJours} j`
                      : "—"}
                  </span>
                </div>

                <div style={mobileActionsStyle}>
                  <button
                    type="button"
                    style={{ ...viewButtonStyle, flex: 1 }}
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(
                        `/cotisation-configs/association/${config.associationId}`
                      );
                    }}
                  >
                    👁️
                  </button>

                  <button
                    type="button"
                    style={{ ...editButtonStyle, flex: 1 }}
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(
                        `/cotisation-configs/association/${config.associationId}/edit`
                      );
                    }}
                  >
                    ✏️
                  </button>

                  <button
                    type="button"
                    style={{ ...deleteButtonStyle, flex: 1 }}
                    onClick={(event) =>
                      handleDeleteClick(config.associationId, event)
                    }
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderStyle}>
                <th style={thStyle}>Association</th>
                <th style={thStyle}>Montant</th>
                <th style={thStyle}>Périodicité</th>

                {!isTablet && <th style={thStyle}>Jour limite</th>}
                {!isTablet && <th style={thStyle}>Pénalité</th>}
                {!isTablet && <th style={thStyle}>Délai rappel</th>}

                <th style={thStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {configs.length === 0 ? (
                <tr>
                  <td
                    colSpan={isTablet ? 4 : 7}
                    style={emptyTableCellStyle}
                  >
                    Aucune configuration
                  </td>
                </tr>
              ) : (
                configs.map((config) => (
                  <tr
                    key={config.id ?? config.associationId}
                    style={tableRowStyle}
                    onClick={() =>
                      navigate(
                        `/cotisation-configs/association/${config.associationId}`
                      )
                    }
                  >
                    <td style={associationCellStyle}>
                      {getAssociationName(config.associationId)}
                    </td>

                    <td style={tdStyle}>
                      <span style={amountStyle}>
                        {formatCurrency(config.montantDefaut)}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <span style={periodicityBadgeStyle}>
                        {PERIODICITE_LABELS[config.periodicite]}
                      </span>
                    </td>

                    {!isTablet && (
                      <td style={tdStyle}>
                        {config.jourLimitePaiement
                          ? `Jour ${config.jourLimitePaiement}`
                          : "—"}
                      </td>
                    )}

                    {!isTablet && (
                      <td style={tdStyle}>
                        {formatCurrency(config.penaliteRetard)}
                      </td>
                    )}

                    {!isTablet && (
                      <td style={tdStyle}>
                        {config.delaiRappelJours
                          ? `${config.delaiRappelJours} j`
                          : "—"}
                      </td>
                    )}

                    <td style={tdStyle}>
                      <div style={actionsStyle}>
                        <button
                          type="button"
                          style={viewButtonStyle}
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(
                              `/cotisation-configs/association/${config.associationId}`
                            );
                          }}
                        >
                          👁️
                        </button>

                        <button
                          type="button"
                          style={editButtonStyle}
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(
                              `/cotisation-configs/association/${config.associationId}/edit`
                            );
                          }}
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          style={deleteButtonStyle}
                          onClick={(event) =>
                            handleDeleteClick(config.associationId, event)
                          }
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const pageStyle = (isMobile: boolean): CSSProperties => ({
  padding: isMobile ? "12px" : "24px 20px",
});

const breadcrumbStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 16,
  fontSize: 14,
};

const breadcrumbHomeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#6b7280",
  cursor: "pointer",
  fontWeight: 500,
};

const breadcrumbSeparatorStyle: CSSProperties = {
  color: "#9ca3af",
  fontSize: 16,
};

const breadcrumbCurrentStyle: CSSProperties = {
  color: "#111827",
  fontWeight: 600,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
};

const titleStyle = (isMobile: boolean): CSSProperties => ({
  color: "#2c3e50",
  margin: 0,
  fontSize: isMobile ? 16 : 22,
});

const addButtonStyle: CSSProperties = {
  padding: "10px 16px",
  background: "#8b5cf6",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};

const statsGridStyle = (isMobile: boolean): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0,1fr))",
  gap: isMobile ? 8 : 12,
  marginBottom: 20,
});

const statCardStyle = (isMobile: boolean): CSSProperties => ({
  borderRadius: 10,
  padding: isMobile ? "12px" : "16px 20px",
});

const statLabelStyle: CSSProperties = {
  fontSize: 11,
  color: "#6b7280",
  marginBottom: 4,
};

const statValueStyle = (isMobile: boolean): CSSProperties => ({
  fontSize: isMobile ? 22 : 28,
  fontWeight: 600,
});

const errorBannerStyle: CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#dc2626",
  borderRadius: 8,
  padding: "12px 16px",
  marginBottom: 16,
};

const loadingStyle: CSSProperties = {
  textAlign: "center",
  padding: 40,
  color: "#6b7280",
};

const mobileListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const emptyStateStyle: CSSProperties = {
  textAlign: "center",
  color: "#9ca3af",
};

const mobileCardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: 10,
  padding: 14,
  border: "1px solid #eee",
  cursor: "pointer",
};

const mobileTitleStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: 15,
};

const mobileMetaStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 6,
  flexWrap: "wrap",
};

const mobileDetailsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  marginTop: 8,
  fontSize: 12,
  color: "#6b7280",
};

const amountStyle: CSSProperties = {
  fontWeight: 600,
  color: "#059669",
  fontSize: 13,
};

const periodicityBadgeStyle: CSSProperties = {
  background: "#ede9fe",
  color: "#5b21b6",
  padding: "2px 8px",
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 600,
};

const mobileActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 10,
};

const tableWrapperStyle: CSSProperties = {
  background: "white",
  borderRadius: 8,
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const tableHeaderStyle: CSSProperties = {
  background: "#8b5cf6",
  color: "white",
};

const thStyle: CSSProperties = {
  padding: "12px 16px",
  textAlign: "center",
};

const tableRowStyle: CSSProperties = {
  textAlign: "center",
  borderBottom: "1px solid #eee",
  background: "white",
  cursor: "pointer",
};

const tdStyle: CSSProperties = {
  padding: "10px 16px",
};

const associationCellStyle: CSSProperties = {
  padding: "10px 16px",
  fontWeight: 600,
};

const emptyTableCellStyle: CSSProperties = {
  textAlign: "center",
  padding: 40,
  color: "#9ca3af",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 4,
};

const viewButtonStyle: CSSProperties = {
  background: "#3b82f6",
  color: "white",
  border: "none",
  padding: "6px 8px",
  borderRadius: 5,
  cursor: "pointer",
};

const editButtonStyle: CSSProperties = {
  background: "#f59e0b",
  color: "white",
  border: "none",
  padding: "6px 8px",
  borderRadius: 5,
  cursor: "pointer",
};

const deleteButtonStyle: CSSProperties = {
  background: "#e74c3c",
  color: "white",
  border: "none",
  padding: "6px 8px",
  borderRadius: 5,
  cursor: "pointer",
};