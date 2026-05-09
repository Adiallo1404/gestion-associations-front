import { useEffect, useState } from "react";
import { memberService } from "../api/memberService";
import { useNavigate } from "react-router-dom";
import type { Member } from "../types/member";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize";
import ExportPdfButton from "../components/ExportPdfButton";

export default function MemberListPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [page, setPage] = useState(0);

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

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const data = await memberService.getAll({
        ...filters,
        page,
      });

      const content =
        data?.content || (Array.isArray(data) ? data : []);

      setMembers(content);
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des membres:",
        err
      );

      setMembers([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, page]);

  const handleDeleteClick = (
    id: number,
    name: string
  ) =>
    setModal({
      isOpen: true,
      id,
      label: name,
    });

  const handleConfirmDelete = async () => {
    if (!modal.id) return;

    try {
      await memberService.delete(modal.id);

      setModal({
        isOpen: false,
        id: null,
        label: "",
      });

      fetchData();
    } catch (err) {
      console.error("Erreur suppression:", err);

      setModal({
        isOpen: false,
        id: null,
        label: "",
      });
    }
  };

  const handleCancelDelete = () =>
    setModal({
      isOpen: false,
      id: null,
      label: "",
    });

  const pdfOptions = {
    title: "Liste des membres",
    subtitle: "Export complet des membres enregistrés",
    filename: "membres",

    columns: [
      {
        header: "Prénom",
        accessor: (m: Member) =>
          m.firstName ?? "—",
        width: 1.2,
      },
      {
        header: "Nom",
        accessor: (m: Member) =>
          m.lastName ?? "—",
        width: 1.2,
      },
      {
        header: "Email",
        accessor: (m: Member) =>
          m.email ?? "—",
        width: 2,
      },
      {
        header: "Téléphone",
        accessor: (m: Member) =>
          m.phone ?? "—",
        width: 1.2,
      },
      {
        header: "Association",
        accessor: (m: Member) =>
          (m as any).associationName ?? "—",
        width: 1.5,
      },
    ],

    data: members,
  };

  return (
    <div
      style={{
        padding: isMobile ? "12px" : "20px",
      }}
    >
      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer le membre"
        message={`Êtes-vous sûr de vouloir supprimer "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
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
          Membres
        </span>
      </nav>

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{
            color: "#2c3e50",
            margin: 0,
            fontSize: isMobile ? 18 : 22,
          }}
        >
          👥 Membres
        </h2>

        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          <ExportPdfButton
            isMobile={isMobile}
            options={pdfOptions}
          />

          <button
            style={btnAdd}
            onClick={() =>
              navigate("/members/new")
            }
          >
            {isMobile
              ? "➕"
              : "➕ Ajouter un membre"}
          </button>
        </div>
      </div>

      {/* FILTRES */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          flexDirection: isMobile
            ? "column"
            : "row",
        }}
      >
        <input
          placeholder="Prénom"
          style={{
            ...inputStyle,
            flex: 1,
          }}
          onChange={(e) => {
            setPage(0);

            setFilters({
              ...filters,
              firstName: e.target.value,
            });
          }}
        />

        <input
          placeholder="Nom"
          style={{
            ...inputStyle,
            flex: 1,
          }}
          onChange={(e) => {
            setPage(0);

            setFilters({
              ...filters,
              lastName: e.target.value,
            });
          }}
        />

        {!isMobile && (
          <input
            placeholder="Email"
            style={{
              ...inputStyle,
              flex: 1,
            }}
            onChange={(e) => {
              setPage(0);

              setFilters({
                ...filters,
                email: e.target.value,
              });
            }}
          />
        )}

        <button
          style={btnPrimary}
          onClick={fetchData}
        >
          {isMobile ? "🔍" : "🔍 Filtrer"}
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
          {members.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#9ca3af",
                padding: "20px",
              }}
            >
              Aucun membre trouvé
            </p>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: 14,
                  border: "1px solid #eee",
                  boxShadow:
                    "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    marginBottom: 4,
                  }}
                >
                  {m.firstName} {m.lastName}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginBottom: 2,
                  }}
                >
                  📧 {m.email}
                </div>

                {m.phone && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      marginBottom: 2,
                    }}
                  >
                    📞 {m.phone}
                  </div>
                )}

                {(m as any).associationName && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      marginBottom: 10,
                    }}
                  >
                    🏢 {(m as any).associationName}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <button
                    style={{
                      ...btnView,
                      flex: 1,
                    }}
                    onClick={() =>
                      navigate(`/members/${m.id}`)
                    }
                  >
                    👁️
                  </button>

                  <button
                    style={{
                      ...btnEdit,
                      flex: 1,
                    }}
                    onClick={() =>
                      navigate(
                        `/members/${m.id}/edit`
                      )
                    }
                  >
                    ✏️
                  </button>

                  <button
                    style={{
                      ...btnDelete,
                      flex: 1,
                    }}
                    onClick={() =>
                      handleDeleteClick(
                        m.id!,
                        `${m.firstName} ${m.lastName}`
                      )
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
        // DESKTOP/TABLET
        <div
          style={{
            overflowX: "auto",
            background: "white",
            borderRadius: "8px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <table style={tableStyle}>
            <thead>
              <tr
                style={{
                  background: "#3498db",
                  color: "white",
                }}
              >
                <th style={thStyle}>
                  Nom complet
                </th>

                <th style={thStyle}>
                  Email
                </th>

                {!isTablet && (
                  <th style={thStyle}>
                    Téléphone
                  </th>
                )}

                {!isTablet && (
                  <th style={thStyle}>
                    Association
                  </th>
                )}

                <th style={thStyle}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "#9ca3af",
                    }}
                  >
                    Aucun membre trouvé
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr
                    key={m.id}
                    style={{
                      textAlign: "center",
                      borderBottom:
                        "1px solid #eee",
                    }}
                  >
                    <td style={tdStyle}>
                      {m.firstName} {m.lastName}
                    </td>

                    <td style={tdStyle}>
                      {m.email}
                    </td>

                    {!isTablet && (
                      <td style={tdStyle}>
                        {m.phone || "—"}
                      </td>
                    )}

                    {!isTablet && (
                      <td style={tdStyle}>
                        {(m as any)
                          .associationName || "—"}
                      </td>
                    )}

                    <td style={tdStyle}>
                      <button
                        style={btnView}
                        onClick={() =>
                          navigate(
                            `/members/${m.id}`
                          )
                        }
                      >
                        👁️
                      </button>

                      <button
                        style={btnEdit}
                        onClick={() =>
                          navigate(
                            `/members/${m.id}/edit`
                          )
                        }
                      >
                        ✏️
                      </button>

                      <button
                        style={btnDelete}
                        onClick={() =>
                          handleDeleteClick(
                            m.id!,
                            `${m.firstName} ${m.lastName}`
                          )
                        }
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          style={btnPage}
          onClick={() =>
            setPage(page - 1)
          }
          disabled={page === 0}
        >
          ⬅
        </button>

        <span
          style={{
            fontSize: isMobile ? 13 : 14,
            fontWeight: 600,
          }}
        >
          Page {page + 1}
        </span>

        <button
          style={btnPage}
          onClick={() =>
            setPage(page + 1)
          }
        >
          ➡
        </button>
      </div>
    </div>
  );
}

// --- STYLES ---

const breadcrumbStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 16,
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

const inputStyle = {
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
} as React.CSSProperties;

const btnPrimary = {
  padding: "8px 12px",
  background: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
} as React.CSSProperties;

const btnAdd = {
  padding: "10px 16px",
  background: "#2ecc71",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 600,
} as React.CSSProperties;

const btnView = {
  marginRight: 5,
  background: "#3498db",
  color: "white",
  border: "none",
  padding: "6px 8px",
  borderRadius: "5px",
  cursor: "pointer",
} as React.CSSProperties;

const btnEdit = {
  marginRight: 5,
  background: "#27ae60",
  color: "white",
  border: "none",
  padding: "6px 8px",
  borderRadius: "5px",
  cursor: "pointer",
} as React.CSSProperties;

const btnDelete = {
  background: "#e74c3c",
  color: "white",
  border: "none",
  padding: "6px 8px",
  borderRadius: "5px",
  cursor: "pointer",
} as React.CSSProperties;

const btnPage = {
  padding: "6px 12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  cursor: "pointer",
  background: "white",
} as React.CSSProperties;

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const thStyle = {
  padding: "12px 16px",
  fontWeight: 600,
} as React.CSSProperties;

const tdStyle = {
  padding: "10px 16px",
} as React.CSSProperties;