import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getBureauByAssociation, getBureauActifByAssociation, deleteBureau, closeBureau } from "../api/bureauService";
import { getAssociations } from "../api/associationService";
import { useRole } from "../hooks/useRole";
import { toast } from "react-toastify";
import type { Bureau } from "../types/bureau";
import type { Association } from "../types/association";

const POSTE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  "Président":       { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "Vice-Président":  { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  "Trésorier":       { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  "Secrétaire":      { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  "Adjoint":         { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

const getPosteStyle = (poste: string) =>
  POSTE_COLORS[poste] || { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };

const getInitials = (prenom?: string, nom?: string) =>
  `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase() || "??";

export default function BureauListPage() {
  const navigate = useNavigate();
  const { isAdminOrSuperAdmin } = useRole();

  const [bureaux, setBureaux] = useState<Bureau[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [selectedAssoc, setSelectedAssoc] = useState<number | "">("");
  const [filtreActif, setFiltreActif] = useState<boolean>(true);
  const [view, setView] = useState<"cartes" | "organigramme">("cartes");
  const [loading, setLoading] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  // Load associations once and select the first one by default.
  useEffect(() => {
    getAssociations({}, 0, 1000)
      .then((r) => {
        setAssociations(r.content);
        if (r.content.length > 0) setSelectedAssoc(r.content[0].id);
      })
      .catch(() => toast.error("Erreur lors du chargement des associations"));
  }, []);

  const fetchBureaux = useCallback(() => {
    if (!selectedAssoc) return;

    setLoading(true);
    const fn = filtreActif ? getBureauActifByAssociation : getBureauByAssociation;
    fn(Number(selectedAssoc))
      .then(setBureaux)
      .catch(() => toast.error("Erreur lors du chargement des postes"))
      .finally(() => setLoading(false));
  }, [selectedAssoc, filtreActif]);

  useEffect(() => {
    fetchBureaux();
  }, [fetchBureaux]);

  const handleDelete = async (id: number) => {
    try {
      await deleteBureau(id);
      toast.success("Poste supprimé");
      setBureaux((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setConfirmId(null);
    }
  };

  const handleCloturer = async (id: number) => {
    try {
      await closeBureau(id);
      toast.success("Poste clôturé");
      fetchBureaux();
    } catch {
      toast.error("Erreur lors de la clôture");
    }
  };

  // Organigramme — group entries by position.
  const grouped = bureaux.reduce((acc, b) => {
    const key = b.poste;
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {} as Record<string, Bureau[]>);

  const inputStyle: React.CSSProperties = {
    padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db",
    fontSize: 13, color: "#374151", background: "#fff", outline: "none",
    cursor: "pointer",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", padding: "28px 24px" }}>

      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 14 }}>
        <span style={{ color: "#6b7280", cursor: "pointer", fontWeight: 500 }} onClick={() => navigate("/")}>Accueil</span>
        <span style={{ color: "#9ca3af" }}>›</span>
        <span style={{ color: "#111827", fontWeight: 600 }}>Bureau & Organigramme</span>
      </nav>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#0f172a" }}>Bureau & Organigramme</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6b7280" }}>Gérez les postes et visualisez la structure</p>
        </div>
        {isAdminOrSuperAdmin && (
          <button
            onClick={() => navigate("/bureaux/new")}
            style={{ background: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(29,78,216,0.3)" }}
          >
            + Nouveau poste
          </button>
        )}
      </div>

      {/* Filtres */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <select
          style={inputStyle}
          value={selectedAssoc}
          onChange={(e) => setSelectedAssoc(Number(e.target.value))}
        >
          {associations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <div style={{ display: "flex", gap: 8 }}>
          {[true, false].map((v) => (
            <button
              key={String(v)}
              onClick={() => setFiltreActif(v)}
              style={{ padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: filtreActif === v ? "#1d4ed8" : "#f1f5f9", color: filtreActif === v ? "#fff" : "#6b7280" }}
            >
              {v ? "Actifs" : "Tous"}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {(["cartes", "organigramme"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{ padding: "6px 16px", borderRadius: 20, border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 13, fontWeight: 600, background: view === v ? "#0f172a" : "#fff", color: view === v ? "#fff" : "#6b7280" }}
            >
              {v === "cartes" ? "Cartes" : "Organigramme"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
          <p>Chargement…</p>
        </div>
      ) : bureaux.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>Aucun poste trouvé</p>
          <p style={{ fontSize: 14 }}>Ajoutez des membres au bureau de cette association</p>
        </div>
      ) : view === "cartes" ? (

        // ── VUE CARTES ────────────────────────────────────────────────────────
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {bureaux.map((b) => {
            const st = getPosteStyle(b.poste);
            return (
              <div key={b.id} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${st.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <div style={{ height: 6, background: st.color }} />
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: st.bg, border: `2px solid ${st.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: st.color, flexShrink: 0 }}>
                      {getInitials(b.membrePrenom, b.membreNom)}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{b.membrePrenom} {b.membreNom}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{b.membreEmail}</div>
                    </div>
                  </div>

                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                    {b.poste}
                  </div>

                  {b.description && (
                    <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 10px", lineHeight: 1.5 }}>{b.description}</p>
                  )}
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    Depuis : <strong style={{ color: "#374151" }}>{b.dateDebut}</strong>
                    {b.dateFin && <> → <strong style={{ color: "#374151" }}>{b.dateFin}</strong></>}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: b.actif ? "#d1fae5" : "#f3f4f6", color: b.actif ? "#065f46" : "#6b7280" }}>
                      {b.actif ? "Actif" : "Clôturé"}
                    </span>
                  </div>

                  {isAdminOrSuperAdmin && (
                    <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                      <button
                        onClick={() => navigate(`/bureaux/${b.id}/edit`)}
                        style={{ flex: 1, padding: "7px", borderRadius: 8, background: "#f0fdf4", color: "#16a34a", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                      >
                        Modifier
                      </button>
                      {b.actif && (
                        <button
                          onClick={() => handleCloturer(b.id)}
                          style={{ flex: 1, padding: "7px", borderRadius: 8, background: "#fffbeb", color: "#d97706", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >
                          Clôturer
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmId(b.id)}
                        style={{ padding: "7px 10px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", border: "none", fontSize: 13, cursor: "pointer" }}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        // ── VUE ORGANIGRAMME ──────────────────────────────────────────────────
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "32px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#2563eb", color: "#fff", padding: "12px 28px", borderRadius: 12, fontSize: 16, fontWeight: 700, boxShadow: "0 4px 16px rgba(29,78,216,0.3)" }}>
              {associations.find((a) => a.id === Number(selectedAssoc))?.name || "Association"}
            </div>
            <div style={{ width: 2, height: 32, background: "#e2e8f0", margin: "0 auto" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {Object.entries(grouped).map(([poste, membres], idx) => {
              const st = getPosteStyle(poste);
              return (
                <div key={poste}>
                  {idx > 0 && <div style={{ width: 2, height: 20, background: "#e2e8f0", margin: "0 auto -20px" }} />}

                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ display: "inline-block", background: st.bg, color: st.color, border: `2px solid ${st.border}`, padding: "8px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, letterSpacing: "0.04em" }}>
                      {poste}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                    {membres.map((b) => (
                      <div key={b.id} style={{ background: "#fff", border: `1px solid ${st.border}`, borderRadius: 12, padding: "16px 20px", textAlign: "center", minWidth: 160, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: st.bg, border: `2px solid ${st.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: st.color, margin: "0 auto 10px" }}>
                          {getInitials(b.membrePrenom, b.membreNom)}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{b.membrePrenom} {b.membreNom}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>Depuis {b.dateDebut}</div>
                        <div style={{ marginTop: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: b.actif ? "#d1fae5" : "#f3f4f6", color: b.actif ? "#065f46" : "#6b7280" }}>
                            {b.actif ? "Actif" : "Clôturé"}
                          </span>
                        </div>
                        {isAdminOrSuperAdmin && (
                          <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "center" }}>
                            <button
                              onClick={() => navigate(`/bureaux/${b.id}/edit`)}
                              style={{ padding: "4px 10px", borderRadius: 6, background: "#f0fdf4", color: "#16a34a", border: "none", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                            >
                              Modifier
                            </button>
                            {b.actif && (
                              <button
                                onClick={() => handleCloturer(b.id)}
                                style={{ padding: "4px 10px", borderRadius: 6, background: "#fffbeb", color: "#d97706", border: "none", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                              >
                                Clôturer
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmId(b.id)}
                              style={{ padding: "4px 10px", borderRadius: 6, background: "#fef2f2", color: "#dc2626", border: "none", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                            >
                              Suppr.
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "28px", maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a", textAlign: "center" }}>Supprimer ce poste ?</h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6b7280", textAlign: "center" }}>Cette action est irréversible.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmId(null)}
                style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}