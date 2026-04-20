import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLien } from "../api/lienPartageService";
import type { LienPartage } from "../types/lienPartage";

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "32px 40px",
    textAlign: "left",
    maxWidth: "560px",
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text)",
    fontSize: "14px",
    cursor: "pointer",
    padding: "0 0 16px 0",
    fontFamily: "var(--sans)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 500,
    color: "var(--text-h)",
    margin: "0 0 24px 0",
  },
  alert: {
    border: "1px solid #fca5a5",
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "14px",
    marginBottom: "20px",
  },
  card: {
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "24px",
  },
  field: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-h)",
    marginBottom: "6px",
  },
  hint: {
    fontSize: "12px",
    color: "var(--text)",
    marginTop: "4px",
  },
  input: {
    width: "100%",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    color: "var(--text-h)",
    background: "var(--bg)",
    fontFamily: "var(--sans)",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  switchRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "24px",
  },
  switchLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-h)",
  },
  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "4px",
  },
  btnPrimary: {
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "9px 24px",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "var(--sans)",
    fontWeight: 500,
  },
  btnOutline: {
    background: "transparent",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "9px 24px",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "var(--sans)",
  },
  required: {
    color: "#dc2626",
    marginLeft: "3px",
  },
};

const LienPartageFormPage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<Partial<LienPartage>>({
    token: "",
    dateExpiration: "",
    nombreAccesMax: 1,
    actif: true,
    documentId: undefined,
    creeParId: undefined,
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? value === "" ? undefined : Number(value)
          : value,
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.documentId) {
      setError("Le Document ID est obligatoire.");
      return;
    }
    if (!form.dateExpiration) {
      setError("La date d'expiration est obligatoire.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: LienPartage = {
        ...(form as LienPartage),
        token: form.token?.trim() === "" ? undefined : form.token,
      };
      await createLien(payload);
      navigate("/liens-partage");
    } catch {
      setError("Erreur lors de la création du lien de partage.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate("/liens-partage")}>
        ← Retour à la liste
      </button>

      <h2 style={styles.title}>Nouveau lien de partage</h2>

      {error && <div style={styles.alert}>{error}</div>}

      <div style={styles.card}>
        <div style={styles.field}>
          <label style={styles.label}>Token <span style={{ ...styles.hint, marginTop: 0 }}>(optionnel)</span></label>
          <input
            style={styles.input}
            type="text"
            name="token"
            value={form.token ?? ""}
            onChange={handleChange}
            placeholder="Laissez vide pour auto-génération"
          />
          <p style={styles.hint}>Si non renseigné, le token sera généré automatiquement.</p>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Date d'expiration <span style={styles.required}>*</span>
          </label>
          <input
            style={styles.input}
            type="datetime-local"
            name="dateExpiration"
            value={form.dateExpiration ?? ""}
            onChange={handleChange}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Nombre d'accès maximum</label>
          <input
            style={styles.input}
            type="number"
            name="nombreAccesMax"
            min={1}
            value={form.nombreAccesMax ?? ""}
            onChange={handleChange}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Document ID <span style={styles.required}>*</span>
          </label>
          <input
            style={styles.input}
            type="number"
            name="documentId"
            value={form.documentId ?? ""}
            onChange={handleChange}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Créé par <span style={{ ...styles.hint, marginTop: 0 }}>(User ID)</span></label>
          <input
            style={styles.input}
            type="number"
            name="creeParId"
            value={form.creeParId ?? ""}
            onChange={handleChange}
          />
        </div>

        <div style={styles.switchRow}>
          <input
            type="checkbox"
            id="actif"
            name="actif"
            checked={form.actif ?? true}
            onChange={handleChange}
            style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent)" }}
          />
          <label htmlFor="actif" style={styles.switchLabel}>Actif</label>
        </div>

        <div style={styles.actions}>
          <button
            style={{ ...styles.btnPrimary, opacity: submitting ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Création..." : "Créer"}
          </button>
          <button style={styles.btnOutline} onClick={() => navigate("/liens-partage")}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default LienPartageFormPage;