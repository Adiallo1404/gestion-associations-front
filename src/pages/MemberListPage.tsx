import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Member, MemberFilter } from "../types/member";
import { memberService } from "../api/memberService";
import ConfirmModal from "../components/ConfirmModal";
import ExportPdfButton from "../components/ExportPdfButton";
import { useWindowSize } from "../hooks/useWindowSize";

interface DeleteModalState {
  isOpen: boolean;
  id: number | null;
  label: string;
}

const PAGE_SIZE = 10;

export default function MemberListPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();

  const [members, setMembers] = useState<Member[]>([]);
  const [filters, setFilters] = useState<MemberFilter>({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [modal, setModal] = useState<DeleteModalState>({
    isOpen: false,
    id: null,
    label: "",
  });

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await memberService.getAll({
        ...filters,
        page,
        size: PAGE_SIZE,
        sort: "lastName,asc",
      });

      setMembers(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to load members", error);
      setMembers([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const updateFilter = (
    key: keyof MemberFilter,
    value: string | boolean | number | undefined
  ) => {
    setPage(0);

    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value || undefined,
    }));
  };

  const handleDeleteClick = (id: number, label: string) => {
    setModal({
      isOpen: true,
      id,
      label,
    });
  };

  const handleCancelDelete = () => {
    setModal({
      isOpen: false,
      id: null,
      label: "",
    });
  };

  const handleConfirmDelete = async () => {
    if (modal.id === null) return;

    try {
      await memberService.remove(modal.id);

      handleCancelDelete();
      await fetchMembers();
    } catch (error) {
      console.error("Failed to delete member", error);
      handleCancelDelete();
    }
  };

  const pdfOptions = useMemo(
    () => ({
      title: "Liste des membres",
      subtitle: "Export complet des membres enregistrés",
      filename: "membres",
      columns: [
        {
          header: "Prénom",
          accessor: (member: Member) => member.firstName || "—",
          width: 1.2,
        },
        {
          header: "Nom",
          accessor: (member: Member) => member.lastName || "—",
          width: 1.2,
        },
        {
          header: "Email",
          accessor: (member: Member) => member.email || "—",
          width: 2,
        },
        {
          header: "Téléphone",
          accessor: (member: Member) => member.phone || "—",
          width: 1.2,
        },
        {
          header: "Association",
          accessor: (member: Member) => member.associationName || "—",
          width: 1.5,
        },
      ],
      data: members,
    }),
    [members]
  );

  return (
    <div style={{ padding: isMobile ? "12px" : "20px" }}>
      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer le membre"
        message={`Êtes-vous sûr de vouloir supprimer "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <nav style={breadcrumbStyle}>
        <span style={breadcrumbHome} onClick={() => navigate("/")}>
          🏠 Accueil
        </span>

        <span style={breadcrumbSeparator}>›</span>

        <span style={breadcrumbCurrent}>Membres</span>
      </nav>

      <div style={headerStyle}>
        <h2
          style={{
            color: "#2c3e50",
            margin: 0,
            fontSize: isMobile ? 18 : 22,
          }}
        >
          👥 Membres
        </h2>

        <div style={headerActionsStyle}>
          <ExportPdfButton isMobile={isMobile} options={pdfOptions} />

          <button style={btnAdd} onClick={() => navigate("/members/new")}>
            {isMobile ? "➕" : "➕ Ajouter un membre"}
          </button>
        </div>
      </div>

      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <input
          placeholder="Prénom"
          style={{ ...inputStyle, flex: 1 }}
          value={filters.firstName ?? ""}
          onChange={(event) => updateFilter("firstName", event.target.value)}
        />

        <input
          placeholder="Nom"
          style={{ ...inputStyle, flex: 1 }}
          value={filters.lastName ?? ""}
          onChange={(event) => updateFilter("lastName", event.target.value)}
        />

        {!isMobile && (
          <input
            placeholder="Email"
            style={{ ...inputStyle, flex: 1 }}
            value={filters.email ?? ""}
            onChange={(event) => updateFilter("email", event.target.value)}
          />
        )}
      </div>

      {isLoading ? (
        <p style={emptyStateStyle}>Chargement des membres...</p>
      ) : isMobile ? (
        <div style={mobileListStyle}>
          {members.length === 0 ? (
            <p style={emptyStateStyle}>Aucun membre trouvé</p>
          ) : (
            members.map((member) => (
              <div key={member.id} style={mobileCardStyle}>
                <div style={mobileCardTitleStyle}>
                  {member.firstName} {member.lastName}
                </div>

                <div style={mobileCardTextStyle}>📧 {member.email}</div>

                <div style={mobileCardTextStyle}>📞 {member.phone}</div>

                {member.associationName && (
                  <div style={mobileCardAssociationStyle}>
                    🏢 {member.associationName}
                  </div>
                )}

                <div style={mobileActionsStyle}>
                  <button
                    style={{ ...btnView, flex: 1 }}
                    onClick={() => navigate(`/members/${member.id}`)}
                  >
                    👁️
                  </button>

                  <button
                    style={{ ...btnEdit, flex: 1 }}
                    onClick={() => navigate(`/members/${member.id}/edit`)}
                  >
                    ✏️
                  </button>

                  <button
                    style={{ ...btnDelete, flex: 1 }}
                    onClick={() =>
                      handleDeleteClick(
                        member.id,
                        `${member.firstName} ${member.lastName}`
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
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={thStyle}>Nom complet</th>
                <th style={thStyle}>Email</th>

                {!isTablet && <th style={thStyle}>Téléphone</th>}
                {!isTablet && <th style={thStyle}>Association</th>}

                <th style={thStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={isTablet ? 3 : 5} style={emptyTableCellStyle}>
                    Aucun membre trouvé
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} style={tableRowStyle}>
                    <td style={tdStyle}>
                      {member.firstName} {member.lastName}
                    </td>

                    <td style={tdStyle}>{member.email}</td>

                    {!isTablet && <td style={tdStyle}>{member.phone}</td>}

                    {!isTablet && (
                      <td style={tdStyle}>{member.associationName || "—"}</td>
                    )}

                    <td style={tdStyle}>
                      <button
                        style={btnView}
                        onClick={() => navigate(`/members/${member.id}`)}
                      >
                        👁️
                      </button>

                      <button
                        style={btnEdit}
                        onClick={() => navigate(`/members/${member.id}/edit`)}
                      >
                        ✏️
                      </button>

                      <button
                        style={btnDelete}
                        onClick={() =>
                          handleDeleteClick(
                            member.id,
                            `${member.firstName} ${member.lastName}`
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

      <div style={paginationStyle}>
        <button
          style={btnPage}
          onClick={() => setPage((currentPage) => currentPage - 1)}
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
          Page {page + 1} / {Math.max(totalPages, 1)}
        </span>

        <button
          style={btnPage}
          onClick={() => setPage((currentPage) => currentPage + 1)}
          disabled={totalPages === 0 || page + 1 >= totalPages}
        >
          ➡
        </button>
      </div>
    </div>
  );
}

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

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
  gap: 12,
  flexWrap: "wrap",
};

const headerActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
};

const inputStyle: React.CSSProperties = {
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const btnAdd: React.CSSProperties = {
  padding: "10px 16px",
  background: "#2ecc71",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 600,
};

const btnView: React.CSSProperties = {
  marginRight: 5,
  background: "#3498db",
  color: "white",
  border: "none",
  padding: "6px 8px",
  borderRadius: "5px",
  cursor: "pointer",
};

const btnEdit: React.CSSProperties = {
  marginRight: 5,
  background: "#27ae60",
  color: "white",
  border: "none",
  padding: "6px 8px",
  borderRadius: "5px",
  cursor: "pointer",
};

const btnDelete: React.CSSProperties = {
  background: "#e74c3c",
  color: "white",
  border: "none",
  padding: "6px 8px",
  borderRadius: "5px",
  cursor: "pointer",
};

const btnPage: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  cursor: "pointer",
  background: "white",
};

const mobileListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const mobileCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 10,
  padding: 14,
  border: "1px solid #eee",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

const mobileCardTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 15,
  marginBottom: 4,
};

const mobileCardTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 2,
};

const mobileCardAssociationStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#9ca3af",
  marginBottom: 10,
};

const mobileActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 8,
};

const tableContainerStyle: React.CSSProperties = {
  overflowX: "auto",
  background: "white",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const tableHeaderRowStyle: React.CSSProperties = {
  background: "#3498db",
  color: "white",
};

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontWeight: 600,
};

const tableRowStyle: React.CSSProperties = {
  textAlign: "center",
  borderBottom: "1px solid #eee",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 16px",
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#9ca3af",
  padding: "20px",
};

const emptyTableCellStyle: React.CSSProperties = {
  textAlign: "center",
  padding: 40,
  color: "#9ca3af",
};

const paginationStyle: React.CSSProperties = {
  marginTop: 16,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 10,
};