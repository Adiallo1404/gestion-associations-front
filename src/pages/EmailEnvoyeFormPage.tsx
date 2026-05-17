import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendEmail } from "../api/emailEnvoyeService";
import { getMyProfile } from "../api/userService";
import { getAssociations } from "../api/associationService";
import { useRole } from "../hooks/useRole";
import type { EmailEnvoyeDto } from "../types/emailEnvoye";
import type { Association } from "../types/association";  // ← ajouté

const EmailEnvoyeFormPage = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdminOrSuperAdmin } = useRole();

  const [form, setForm] = useState<EmailEnvoyeDto>({
    nomExpediteur: "",
    destinataire:  "",
    sujet:         "",
    contenu:       "",
    associationId: undefined,
  });

  const [associations, setAssociations] = useState<Association[]>([]);  // ← corrigé
  const [errors, setErrors]             = useState<Partial<Record<keyof EmailEnvoyeDto, string>>>({});
  const [submitting, setSubmitting]     = useState(false);
  const [serverError, setServerError]   = useState<string | null>(null);
  const [successMsg, setSuccessMsg]     = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const me = await getMyProfile();
        setForm(prev => ({
          ...prev,
          nomExpediteur: `${me.firstName} ${me.lastName}`.trim(),
          associationId: me.associationId ?? undefined,
        }));
      } catch (e) {
        console.error("Impossible de charger le profil", e);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const loadAssociations = async () => {
      try {
        const res = await getAssociations(0, 100);
        setAssociations(res.content ?? []);
      } catch (e) {
        console.error("Impossible de charger les associations", e);
      }
    };
    loadAssociations();
  }, [isSuperAdmin]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "associationId" ? (value ? Number(value) : undefined) : value,
    }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof EmailEnvoyeDto, string>> = {};
    if (!form.nomExpediteur?.trim())
      newErrors.nomExpediteur = "Le nom de l'expéditeur est obligatoire.";
    if (!form.destinataire?.trim())
      newErrors.destinataire = "Le destinataire est obligatoire.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.destinataire))
      newErrors.destinataire = "Adresse email invalide.";
    if (!form.sujet?.trim())
      newErrors.sujet = "Le sujet est obligatoire.";
    if (form.contenu && form.contenu.length > 5000)
      newErrors.contenu = "Maximum 5000 caractères.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    setSuccessMsg(null);
    try {
      const created = await sendEmail(form);
      if (created.statutEnvoi === "SUCCES") {
        setSuccessMsg(`✅ Email envoyé avec succès à ${created.destinataire} !`);
      } else {
        setServerError("⚠️ L'email a été enregistré mais l'envoi a échoué. Vérifiez la configuration SMTP.");
      }
      setTimeout(() => navigate(`/emails-envoyes/${created.id}`), 2000);
    } catch (err: any) {
      setServerError(err?.response?.data?.message || "Erreur lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (hasError?: string): React.CSSProperties => ({
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${hasError ? "#f87171" : "#d1d5db"}`,
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: hasError ? "#fff7f7" : "#fff",
  });

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
          📧 Nouvel email
        </h2>
        <button
          onClick={() => navigate("/emails-envoyes")}
          style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}
        >
          ← Retour
        </button>
      </div>

      {successMsg && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#16a34a", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontWeight: 500 }}>
          {successMsg}
        </div>
      )}

      {serverError && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
          {serverError}
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 28 }}>
        <form onSubmit={handleSubmit}>

          {/* NOM EXPÉDITEUR */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
              Nom de l'expéditeur <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              name="nomExpediteur"
              value={form.nomExpediteur}
              onChange={handleChange}
              placeholder="Nom complet"
              style={inputStyle(errors.nomExpediteur)}
            />
            {errors.nomExpediteur && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#ef4444" }}>{errors.nomExpediteur}</p>
            )}
          </div>

          {/* DESTINATAIRE */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
              Destinataire <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              name="destinataire"
              type="email"
              value={form.destinataire}
              onChange={handleChange}
              placeholder="email@exemple.com"
              style={inputStyle(errors.destinataire)}
            />
            {errors.destinataire && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#ef4444" }}>{errors.destinataire}</p>
            )}
          </div>

          {/* SUJET */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
              Sujet <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              name="sujet"
              value={form.sujet}
              onChange={handleChange}
              placeholder="Objet du message"
              style={inputStyle(errors.sujet)}
            />
            {errors.sujet && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#ef4444" }}>{errors.sujet}</p>
            )}
          </div>

          {/* ASSOCIATION */}
          {isAdminOrSuperAdmin && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
                Association <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optionnel)</span>
              </label>

              {isSuperAdmin ? (
                <select
                  name="associationId"
                  value={form.associationId ?? ""}
                  onChange={handleChange}
                  style={{ ...inputStyle(), cursor: "pointer" }}
                >
                  <option value="">— Aucune association —</option>
                  {associations.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>  // ← corrigé
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.associationId ? `Association #${form.associationId}` : "Aucune"}
                  disabled
                  style={{ ...inputStyle(), background: "#f8fafc", color: "#94a3b8", cursor: "not-allowed" }}
                />
              )}
            </div>
          )}

          {/* CONTENU */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
              Contenu
            </label>
            <textarea
              name="contenu"
              value={form.contenu}
              onChange={handleChange}
              rows={8}
              placeholder="Corps du message..."
              style={{ ...inputStyle(errors.contenu), resize: "vertical" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              {errors.contenu
                ? <p style={{ margin: 0, fontSize: 12, color: "#ef4444" }}>{errors.contenu}</p>
                : <span />}
              <span style={{ fontSize: 12, color: "#9ca3af" }}>{form.contenu?.length ?? 0} / 5000</span>
            </div>
          </div>

          {/* BOUTONS */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1, padding: "12px 0",
                background: submitting ? "#a5b4fc" : "#4f46e5",
                color: "#fff", border: "none", borderRadius: 8,
                cursor: submitting ? "not-allowed" : "pointer",
                fontWeight: 600, fontSize: 15,
              }}
            >
              {submitting ? "Envoi en cours..." : "📤 Envoyer"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/emails-envoyes")}
              disabled={submitting}
              style={{ padding: "12px 24px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: 15, color: "#374151" }}
            >
              Annuler
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EmailEnvoyeFormPage;