import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjetById, createProjet, updateProjet } from "../api/projetService";
import type { ProjetDto, StatutProjet } from "../types/projet";

const DEVISES = [
  { code: "EUR", label: "€ Euro" },
  { code: "USD", label: "$ Dollar américain" },
  { code: "XOF", label: "FCFA Franc CFA (UEMOA)" },
  { code: "XAF", label: "FCFA Franc CFA (CEMAC)" },
  { code: "GNF", label: "GNF Franc Guinéen" },
  { code: "MAD", label: "MAD Dirham marocain" },
  { code: "DZD", label: "DZD Dinar algérien" },
  { code: "TND", label: "TND Dinar tunisien" },
  { code: "GBP", label: "£ Livre sterling" },
  { code: "CHF", label: "CHF Franc suisse" },
];

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

const ProjetFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<Omit<ProjetDto, "id" | "depenses" | "partenaires" | "totalDepenses">>({
    nom:            "",
    description:    "",
    statut:         "FUTUR" as StatutProjet,
    budget:         undefined,
    devise:         "EUR",
    associationId:  1,
    chefDeProjetId: undefined,
    dateDebut:      "",
    dateFin:        ""
  });

  const [loading, setLoading]       = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && id) {
      const loadProjet = async () => {
        try {
          const data = await getProjetById(Number(id));
          setFormData({
            nom:            data.nom,
            description:    data.description || "",
            statut:         data.statut,
            budget:         data.budget,
            devise:         data.devise || "EUR",
            associationId:  data.associationId,
            chefDeProjetId: data.chefDeProjetId,
            dateDebut:      data.dateDebut ? data.dateDebut.split("T")[0] : "",
            dateFin:        data.dateFin   ? data.dateFin.split("T")[0]   : ""
          });
        } catch {
          setError("Impossible de charger les données du projet.");
        } finally {
          setLoading(false);
        }
      };
      loadProjet();
    }
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "budget" || name === "chefDeProjetId"
        ? (value ? Number(value) : undefined)
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isEditMode && id) {
        await updateProjet(Number(id), { ...formData, id: Number(id) } as ProjetDto);
        navigate(`/projets/${id}`);
      } else {
        const newProjet = await createProjet(formData as ProjetDto);
        navigate(`/projets/${newProjet.id}`);
      }
    } catch {
      setError("Une erreur est survenue lors de l'enregistrement du projet.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "#6b7280", fontSize: 15 }}>
      Chargement...
    </div>
  );

  const deviseSign = getDeviseSign(formData.devise);

  // Styles réutilisables
  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#4b5563",
    letterSpacing: "0.01em",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
    color: "#111827",
    background: "#fff",
    transition: "border-color 0.2s",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: "36px",
  };

  return (
    <div style={{ padding: "32px 24px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        {/* ── En-tête ── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#111827" }}>
              {isEditMode ? `Modifier le projet #${id}` : "Créer un nouveau projet"}
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#9ca3af" }}>
              {isEditMode ? "Modifiez les informations du projet ci-dessous." : "Remplissez les informations pour créer un nouveau projet."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(isEditMode ? `/projets/${id}` : "/projets")}
            style={{
              padding: "9px 18px",
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ← Annuler
          </button>
        </div>

        {/* ── Message d'erreur ── */}
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#dc2626",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Formulaire ── */}
        <form onSubmit={handleSubmit}>

          {/* Section : Informations générales */}
          <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              padding: "14px 20px",
              background: "#fafafa",
              borderBottom: "1px solid #e5e7eb",
            }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                📋 Informations générales
              </h3>
            </div>
            <div style={{ padding: "20px" }}>

              {/* Nom */}
              <div style={{ marginBottom: "18px" }}>
                <label style={labelStyle}>
                  Nom du projet <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  required
                  placeholder="Ex : Construction école primaire"
                  value={formData.nom}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Décrivez les objectifs et le contexte du projet..."
                  value={formData.description}
                  onChange={handleChange}
                  style={{ ...inputStyle, resize: "vertical", minHeight: "100px", lineHeight: "1.5" }}
                />
              </div>

            </div>
          </div>

          {/* Section : Budget & Statut */}
          <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              padding: "14px 20px",
              background: "#fafafa",
              borderBottom: "1px solid #e5e7eb",
            }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                💰 Budget & Statut
              </h3>
            </div>
            <div style={{ padding: "20px" }}>

              {/* Statut + Devise + Budget — 3 colonnes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>

                {/* Statut */}
                <div>
                  <label style={labelStyle}>
                    Statut <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select name="statut" value={formData.statut} onChange={handleChange} style={selectStyle}>
                    <option value="FUTUR">🔵 Futur</option>
                    <option value="EN_COURS">🟢 En cours</option>
                    <option value="TERMINE">✅ Terminé</option>
                  </select>
                </div>

                {/* Devise */}
                <div>
                  <label style={labelStyle}>Devise</label>
                  <select name="devise" value={formData.devise} onChange={handleChange} style={selectStyle}>
                    {DEVISES.map(d => (
                      <option key={d.code} value={d.code}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* Budget */}
                <div>
                  <label style={labelStyle}>Budget alloué</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      name="budget"
                      min="0"
                      placeholder="0"
                      value={formData.budget ?? ""}
                      onChange={handleChange}
                      style={{ ...inputStyle, paddingRight: "48px" }}
                    />
                    <span style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                      fontSize: "13px",
                      fontWeight: 600,
                      pointerEvents: "none",
                    }}>
                      {deviseSign}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Section : Planning */}
          <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "28px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              padding: "14px 20px",
              background: "#fafafa",
              borderBottom: "1px solid #e5e7eb",
            }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                📅 Planning
              </h3>
            </div>
            <div style={{ padding: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                <div>
                  <label style={labelStyle}>Date de début</label>
                  <input
                    type="date"
                    name="dateDebut"
                    value={formData.dateDebut}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Date de fin estimée</label>
                  <input
                    type="date"
                    name="dateFin"
                    value={formData.dateFin}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              type="button"
              onClick={() => navigate(isEditMode ? `/projets/${id}` : "/projets")}
              style={{
                padding: "10px 20px",
                background: "#fff",
                border: "1.5px solid #e5e7eb",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 24px",
                background: submitting ? "#a5b4fc" : "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: submitting ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "14px",
                transition: "background 0.2s",
              }}
            >
              {submitting ? "Enregistrement..." : isEditMode ? "Enregistrer les modifications" : "Créer le projet"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProjetFormPage;