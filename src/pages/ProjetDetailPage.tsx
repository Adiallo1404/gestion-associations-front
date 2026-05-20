import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProjetById,
  deleteDepense,
  deletePartenaire,
  addDepense,
  addPartenaire,
} from "../api/projetService";
import type { ProjetDto, DepenseProjetDto, PartenaireProjetDto, TypePartenaire } from "../types/projet";

const TYPE_PARTENAIRE: { value: TypePartenaire; label: string }[] = [
  { value: "FINANCIER",      label: "💰 Financier" },
  { value: "TECHNIQUE",      label: "🔧 Technique" },
  { value: "INSTITUTIONNEL", label: "🏛️ Institutionnel" },
  { value: "AUTRE",          label: "🔹 Autre" },
];

const getDeviseSign = (deviseCode?: string): string => {
  if (!deviseCode) return "€";
  switch (deviseCode.toUpperCase()) {
    case "EUR": return "€";
    case "USD": return "$";
    case "XOF": case "XAF": return "FCFA";
    case "GNF": return "GNF";
    case "MAD": return "MAD";
    case "DZD": return "DZD";
    case "TND": return "TND";
    case "GBP": return "£";
    case "CHF": return "CHF";
    default: return deviseCode;
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

// ── Modale générique ──────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: 28, width: "100%", maxWidth: 480,
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1.5px solid #e5e7eb",
  fontSize: 14,
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
  color: "#111827",
  background: "#fff",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#4b5563",
};

// ── Section card réutilisable ─────────────────────────────────────────────────
function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        padding: "14px 20px",
        background: "#fafafa",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#374151" }}>{title}</h3>
        {action}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

const ProjetDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [projet, setProjet]               = useState<ProjetDto | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [showDepenseModal,    setShowDepenseModal]    = useState(false);
  const [showPartenaireModal, setShowPartenaireModal] = useState(false);
  const [submitting,          setSubmitting]          = useState(false);

  const [depenseForm, setDepenseForm] = useState<DepenseProjetDto>({
    libelle: "", montant: 0, dateDepense: "", description: "",
  });
  const [partenaireForm, setPartenaireForm] = useState<PartenaireProjetDto>({
    nom: "", type: "AUTRE", description: "", contact: "",
  });

  const fetchProjet = async () => {
    try {
      const data = await getProjetById(Number(id));
      setProjet(data);
      setError(null);
    } catch {
      setError("Projet introuvable ou accès refusé.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchProjet(); }, [id]);

  const handleSubmitDepense = async () => {
    if (!depenseForm.libelle)                          { alert("⚠️ Libellé obligatoire"); return; }
    if (!depenseForm.montant || depenseForm.montant <= 0) { alert("⚠️ Montant obligatoire et positif"); return; }
    setSubmitting(true);
    try {
      await addDepense(Number(id), depenseForm);
      setShowDepenseModal(false);
      setDepenseForm({ libelle: "", montant: 0, dateDepense: "", description: "" });
      fetchProjet();
    } catch { alert("❌ Erreur lors de l'ajout de la dépense."); }
    finally { setSubmitting(false); }
  };

  const handleDeleteDepense = async (depenseId: number) => {
    if (!window.confirm("Supprimer cette dépense ?")) return;
    try { await deleteDepense(depenseId); fetchProjet(); }
    catch { alert("Erreur lors de la suppression."); }
  };

  const handleSubmitPartenaire = async () => {
    if (!partenaireForm.nom) { alert("⚠️ Nom du partenaire obligatoire"); return; }
    setSubmitting(true);
    try {
      await addPartenaire(Number(id), partenaireForm);
      setShowPartenaireModal(false);
      setPartenaireForm({ nom: "", type: "AUTRE", description: "", contact: "" });
      fetchProjet();
    } catch { alert("❌ Erreur lors de l'ajout du partenaire."); }
    finally { setSubmitting(false); }
  };

  const handleDeletePartenaire = async (partenaireId: number) => {
    if (!window.confirm("Détacher ce partenaire ?")) return;
    try { await deletePartenaire(partenaireId); fetchProjet(); }
    catch { alert("Erreur lors du retrait."); }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "#6b7280", fontSize: 15 }}>
      Chargement du projet...
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "12px 16px", fontSize: 14 }}>
        ⚠️ {error}
      </div>
    </div>
  );

  if (!projet) return null;

  const sign          = getDeviseSign(projet.devise);
  const budgetGlobal  = projet.budget ?? 0;
  const totalDepenses = projet.totalDepenses ?? 0;
  const resteAAllouer = budgetGlobal - totalDepenses;
  const statutStyle   = getStatutStyle(projet.statut);

  const btnPrimary: React.CSSProperties = {
    padding: "8px 16px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };

  const btnSecondary: React.CSSProperties = {
    padding: "8px 16px",
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };

  return (
    <div style={{ padding: "32px 24px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* ── Modales ── */}
        {showDepenseModal && (
          <Modal title="➕ Nouvelle dépense" onClose={() => setShowDepenseModal(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Libellé <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={{ ...inputStyle, marginTop: 6 }} placeholder="Ex: Achat matériel"
                  value={depenseForm.libelle} onChange={e => setDepenseForm(p => ({ ...p, libelle: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Montant ({sign}) <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={{ ...inputStyle, marginTop: 6 }} type="number" step="0.01" min="0.01" placeholder="0.00"
                  value={depenseForm.montant || ""}
                  onChange={e => setDepenseForm(p => ({ ...p, montant: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={labelStyle}>Date de la dépense</label>
                <input style={{ ...inputStyle, marginTop: 6 }} type="date" value={depenseForm.dateDepense || ""}
                  onChange={e => setDepenseForm(p => ({ ...p, dateDepense: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, marginTop: 6, resize: "vertical", minHeight: 70 }}
                  placeholder="Détails optionnels..." value={depenseForm.description || ""}
                  onChange={e => setDepenseForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowDepenseModal(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151" }}>
                  Annuler
                </button>
                <button onClick={handleSubmitDepense} disabled={submitting}
                  style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: submitting ? "#a5b4fc" : "#4f46e5", color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>
                  {submitting ? "Enregistrement..." : "💾 Ajouter la dépense"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {showPartenaireModal && (
          <Modal title="🤝 Associer un partenaire" onClose={() => setShowPartenaireModal(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Nom du partenaire <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={{ ...inputStyle, marginTop: 6 }} placeholder="Ex: ONG Solidarité"
                  value={partenaireForm.nom} onChange={e => setPartenaireForm(p => ({ ...p, nom: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Type de partenariat</label>
                <select style={{ ...inputStyle, marginTop: 6, cursor: "pointer" }} value={partenaireForm.type || "AUTRE"}
                  onChange={e => setPartenaireForm(p => ({ ...p, type: e.target.value as TypePartenaire }))}>
                  {TYPE_PARTENAIRE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Contact</label>
                <input style={{ ...inputStyle, marginTop: 6 }} placeholder="Email ou téléphone"
                  value={partenaireForm.contact || ""} onChange={e => setPartenaireForm(p => ({ ...p, contact: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, marginTop: 6, resize: "vertical", minHeight: 70 }}
                  placeholder="Rôle du partenaire..." value={partenaireForm.description || ""}
                  onChange={e => setPartenaireForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowPartenaireModal(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151" }}>
                  Annuler
                </button>
                <button onClick={handleSubmitPartenaire} disabled={submitting}
                  style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: submitting ? "#a5b4fc" : "#4f46e5", color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>
                  {submitting ? "Enregistrement..." : "💾 Associer le partenaire"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ── En-tête ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827" }}>{projet.nom}</h2>
            <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: 13 }}>ID Projet : #{projet.id}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => navigate(`/projets/edit/${projet.id}`)} style={btnSecondary}>
              ✏️ Modifier
            </button>
            <button onClick={() => navigate("/projets")} style={btnSecondary}>
              ← Retour à la liste
            </button>
          </div>
        </div>

        {/* ── Description ── */}
        <SectionCard title="📋 Description">
          <p style={{ margin: 0, color: projet.description ? "#4b5563" : "#9ca3af", fontSize: 14, lineHeight: "1.6", fontStyle: projet.description ? "normal" : "italic" }}>
            {projet.description || "Aucune description enregistrée pour ce projet."}
          </p>
        </SectionCard>

        {/* ── Indicateurs ── */}
        <SectionCard title="📊 Indicateurs financiers & Planning">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
            {[
              {
                label: "Statut du projet",
                value: (
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, ...statutStyle }}>
                    {projet.statut?.replace(/_/g, " ") ?? "—"}
                  </span>
                ),
              },
              {
                label: "Budget alloué",
                value: <span style={{ fontWeight: 600, color: "#111827" }}>{budgetGlobal > 0 ? `${budgetGlobal.toLocaleString("fr-FR")} ${sign}` : `0 ${sign}`}</span>,
              },
              {
                label: "Total des dépenses",
                value: <span style={{ fontWeight: 600, color: totalDepenses > 0 ? "#dc2626" : "#111827" }}>{totalDepenses.toLocaleString("fr-FR")} {sign}</span>,
              },
              {
                label: "Reste disponible",
                value: <span style={{ fontWeight: 700, color: resteAAllouer >= 0 ? "#16a34a" : "#dc2626" }}>{resteAAllouer.toLocaleString("fr-FR")} {sign}</span>,
              },
              {
                label: "Chef de projet",
                value: <span style={{ color: "#111827" }}>{projet.chefDeProjetPrenom ? `${projet.chefDeProjetPrenom} ${projet.chefDeProjetNom}` : "Non assigné"}</span>,
              },
              {
                label: "Date de début",
                value: <span style={{ color: "#111827" }}>{projet.dateDebut ? new Date(projet.dateDebut).toLocaleDateString("fr-FR") : "—"}</span>,
              },
              {
                label: "Date de fin estimée",
                value: <span style={{ color: "#111827" }}>{projet.dateFin ? new Date(projet.dateFin).toLocaleDateString("fr-FR") : "—"}</span>,
              },
            ].map(({ label, value }, i) => (
              <div key={label} style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid #f3f4f6",
                gridColumn: i === 6 ? "1 / -1" : undefined,
              }}>
                <span style={{ width: 180, fontSize: 13, fontWeight: 600, color: "#6b7280", flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 14 }}>{value}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Dépenses ── */}
        <SectionCard
          title="💸 Dépenses imputées"
          action={
            <button onClick={() => setShowDepenseModal(true)} style={btnPrimary}>
              + Nouvelle dépense
            </button>
          }
        >
          {!projet.depenses || projet.depenses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#9ca3af", fontSize: 14, fontStyle: "italic" }}>
              Aucune dépense enregistrée sur ce projet.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                  {["Libellé", "Date", "Montant", "Action"].map((h, i) => (
                    <th key={h} style={{ paddingBottom: 10, fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: i === 3 ? "right" : i === 2 ? "right" : "left" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projet.depenses.map((d) => (
                  <tr key={d.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                    <td style={{ padding: "13px 0", fontSize: 14, fontWeight: 500, color: "#111827" }}>{d.libelle}</td>
                    <td style={{ padding: "13px 0", fontSize: 14, color: "#6b7280" }}>
                      {d.dateDepense ? new Date(d.dateDepense).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td style={{ padding: "13px 0", fontSize: 14, fontWeight: 600, color: "#dc2626", textAlign: "right" }}>
                      -{d.montant.toLocaleString("fr-FR")} {sign}
                    </td>
                    <td style={{ padding: "13px 0", textAlign: "right" }}>
                      <button onClick={() => handleDeleteDepense(d.id!)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>

        {/* ── Partenaires ── */}
        <SectionCard
          title="🤝 Partenaires du projet"
          action={
            <button onClick={() => setShowPartenaireModal(true)} style={btnPrimary}>
              + Associer un partenaire
            </button>
          }
        >
          {!projet.partenaires || projet.partenaires.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#9ca3af", fontSize: 14, fontStyle: "italic" }}>
              Aucun partenaire associé.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {projet.partenaires.map((p) => (
                <div key={p.id} style={{
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  background: "#fafafa",
                }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827" }}>{p.nom}</h4>
                    <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#6b7280" }}>
                      {TYPE_PARTENAIRE.find(t => t.value === p.type)?.label || p.type || "—"}
                    </p>
                    {p.contact && <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#4b5563" }}>📞 {p.contact}</p>}
                    {p.description && <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>"{p.description}"</p>}
                  </div>
                  <button onClick={() => handleDeletePartenaire(p.id!)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                    Détacher
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  );
};

export default ProjetDetailPage;