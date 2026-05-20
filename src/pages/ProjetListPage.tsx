import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getProjetsByFilters, deleteProjet } from "../api/projetService"
import type { ProjetDto, StatutProjet } from "../types/projet"

const getDeviseSign = (code?: string): string => {
  switch ((code || "EUR").toUpperCase()) {
    case "EUR": return "€";
    case "USD": return "$";
    case "XOF": case "XAF": return "FCFA";
    case "GNF": return "GNF";
    case "MAD": return "MAD";
    case "DZD": return "DZD";
    case "TND": return "TND";
    case "GBP": return "£";
    case "CHF": return "CHF";
    default: return code || "€";
  }
};

const getStatutStyle = (statut: string): { background: string; color: string } => {
  switch (statut) {
    case "EN_COURS": return { background: "#e6f4ea", color: "#137333" };
    case "TERMINE":  return { background: "#e8f0fe", color: "#1a73e8" };
    case "FUTUR":    return { background: "#fef3c7", color: "#b45309" };
    default:         return { background: "#f3f4f6", color: "#6b7280" };
  }
};

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({
  page, totalPages, totalElements, size, onPageChange, onSizeChange,
}: {
  page: number; totalPages: number; totalElements: number;
  size: number; onPageChange: (p: number) => void; onSizeChange: (s: number) => void;
}) => {
  const start = totalElements === 0 ? 0 : page * size + 1;
  const end   = Math.min((page + 1) * size, totalElements);

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
    const pages: (number | "...")[] = [];
    if (page <= 3) {
      for (let i = 0; i < 5; i++) pages.push(i);
      pages.push("..."); pages.push(totalPages - 1);
    } else if (page >= totalPages - 4) {
      pages.push(0); pages.push("...");
      for (let i = totalPages - 5; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0); pages.push("...");
      for (let i = page - 1; i <= page + 1; i++) pages.push(i);
      pages.push("..."); pages.push(totalPages - 1);
    }
    return pages;
  };

  const btnBase: React.CSSProperties = {
    width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center",
    border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff", cursor: "pointer",
    fontSize: "14px", color: "#374151", fontWeight: 500,
  };
  const btnDisabled: React.CSSProperties = { ...btnBase, cursor: "not-allowed", opacity: 0.4 };
  const btnActive: React.CSSProperties  = { ...btnBase, background: "#4f46e5", color: "#fff", border: "1px solid #4f46e5" };

  return (
    <div style={{
      padding: "14px 24px", borderTop: "1px solid #edf2f7",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: "#fff", flexWrap: "wrap", gap: "12px",
    }}>
      <span style={{ fontSize: "14px", color: "#6b7280" }}>
        {totalElements > 0 ? `${start}–${end} sur ${totalElements} projets` : "0 projet"}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <button style={page === 0 ? btnDisabled : btnBase} disabled={page === 0} onClick={() => onPageChange(0)}>«</button>
        <button style={page === 0 ? btnDisabled : btnBase} disabled={page === 0} onClick={() => onPageChange(page - 1)}>‹</button>
        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} style={{ width: 36, textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>…</span>
          ) : (
            <button key={p} style={p === page ? btnActive : btnBase} onClick={() => onPageChange(p as number)}>
              {(p as number) + 1}
            </button>
          )
        )}
        <button style={page >= totalPages - 1 ? btnDisabled : btnBase} disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>›</button>
        <button style={page >= totalPages - 1 ? btnDisabled : btnBase} disabled={page >= totalPages - 1} onClick={() => onPageChange(totalPages - 1)}>»</button>
      </div>
      <select value={size} onChange={(e) => { onSizeChange(Number(e.target.value)); }}
        style={{
          padding: "6px 32px 6px 12px", border: "1px solid #e2e8f0", borderRadius: "8px",
          fontSize: "14px", color: "#374151", background: "#fff", outline: "none", cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
        }}>
        <option value={10}>10 / page</option>
        <option value={20}>20 / page</option>
        <option value={50}>50 / page</option>
      </select>
    </div>
  );
};

// ── Breadcrumb ────────────────────────────────────────────────────────────────
const Breadcrumb = ({ items }: { items: { label: string; icon?: string; href?: string; active?: boolean }[] }) => {
  const navigate = useNavigate();
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {i > 0 && <span style={{ color: "#d1d5db", fontSize: "14px" }}>/</span>}
          {item.active ? (
            <span style={{
              padding: "5px 12px",
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
            }}>
              {item.icon && <span style={{ marginRight: 5 }}>{item.icon}</span>}
              {item.label}
            </span>
          ) : (
            <button
              onClick={() => item.href && navigate(item.href)}
              style={{
                padding: "5px 12px",
                background: "transparent",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#6b7280",
                cursor: item.href ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </button>
          )}
        </span>
      ))}
    </nav>
  );
};

// ── Page principale ───────────────────────────────────────────────────────────
const ProjetListPage = () => {
  const navigate = useNavigate()

  const [projets, setProjets]             = useState<ProjetDto[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages]       = useState(1)
  const [page, setPage]                   = useState(0)
  const [size, setSize]                   = useState(10)
  const [searchNom, setSearchNom]         = useState("")
  const [selectStatut, setSelectStatut]   = useState<StatutProjet | "">("")
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)

  const fetchProjets = async () => {
    setLoading(true)
    try {
      const filter = { nom: searchNom || undefined, statut: selectStatut || undefined }
      const data = await getProjetsByFilters(filter, page, size)
      setProjets(data.content)
      setTotalElements(data.totalElements)
      setTotalPages(data.totalPages)
      setError(null)
    } catch {
      setError("Erreur lors du chargement des projets.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProjets() }, [page, size, selectStatut])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchProjets()
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) return
    try { await deleteProjet(id); fetchProjets() }
    catch { alert("Erreur lors de la suppression du projet.") }
  }

  return (
    <div style={{ padding: "24px", background: "#f8fafc", minHeight: "100vh" }}>

      {/* ── Breadcrumb ── */}
      <Breadcrumb items={[
        { label: "Accueil", icon: "🏠", href: "/" },
        { label: "Projets", active: true },
      ]} />

      {/* ── En-tête ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#111827" }}>Vos projets</h2>
        <button onClick={() => navigate("/projets/new")}
          style={{ padding: "10px 16px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          + Créer un projet
        </button>
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "16px" }}>
        <form onSubmit={handleSearchSubmit} style={{ position: "relative", width: "320px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>🔍</span>
          <input type="text" placeholder="Rechercher vos projets" value={searchNom}
            onChange={(e) => setSearchNom(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
        </form>
        <select value={selectStatut} onChange={(e) => { setSelectStatut(e.target.value as StatutProjet | ""); setPage(0); }}
          style={{ padding: "10px 16px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff", fontSize: "14px", outline: "none", color: "#374151" }}>
          <option value="">Tous les statuts</option>
          <option value="FUTUR">🔵 Futur</option>
          <option value="EN_COURS">🟢 En cours</option>
          <option value="TERMINE">✅ Terminé</option>
        </select>
      </div>

      {/* ── Tableau ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>Chargement des projets...</div>
        ) : error ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#dc2626" }}>{error}</div>
        ) : projets.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>Aucun projet trouvé.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #edf2f7", background: "#fafafa" }}>
                <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nom du projet</th>
                <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Statut</th>
                <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Budget</th>
                <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dépenses</th>
                <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projets.map((p) => {
                const deviseSign  = getDeviseSign(p.devise);
                const statutStyle = getStatutStyle(p.statut);
                return (
                  <tr key={p.id} onClick={() => navigate(`/projets/${p.id}`)}
                    style={{ borderBottom: "1px solid #edf2f7", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 500, color: "#1a202c" }}>{p.nom}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, ...statutStyle }}>
                        {p.statut.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", color: "#4a5568" }}>
                      {p.budget ? `${p.budget.toLocaleString("fr-FR")} ${deviseSign}` : "—"}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", color: "#dc2626", fontWeight: 500 }}>
                      {p.totalDepenses ? `${p.totalDepenses.toLocaleString("fr-FR")} ${deviseSign}` : `0 ${deviseSign}`}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => navigate(`/projets/edit/${p.id}`)}
                        style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontWeight: 500, marginRight: "16px" }}>
                        Modifier
                      </button>
                      <button onClick={(e) => handleDelete(p.id!, e)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 500 }}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <Pagination
          page={page} totalPages={totalPages} totalElements={totalElements} size={size}
          onPageChange={(p) => setPage(p)}
          onSizeChange={(s) => { setSize(s); setPage(0); }}
        />
      </div>
    </div>
  )
}

export default ProjetListPage