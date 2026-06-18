import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { createBureau, getBureauById, updateBureau, closeBureau } from "../api/bureauService";
import { getAssociations } from "../api/associationService";
import { memberService } from "../api/memberService";
import type { Association } from "../types/association";
import type { BureauInput } from "../types/bureau";
import { toast } from "react-toastify";

const POSTES_SUGGESTIONS = [
  "Président", "Vice-Président", "Trésorier", "Trésorier adjoint",
  "Secrétaire", "Secrétaire général", "Commissaire aux comptes",
  "Chargé de communication", "Responsable logistique",
];

/**
 * Minimal member shape needed for the dropdown.
 * Adjust to match the actual type returned by memberService.getAll.
 */
interface MemberOption {
  id: number;
  firstName: string;
  lastName: string;
}

interface FormState {
  associationId: string;
  memberId: string;
  poste: string;
  description: string;
  dateDebut: string;
  dateFin: string;
}

const EMPTY_FORM: FormState = {
  associationId: "",
  memberId: "",
  poste: "",
  description: "",
  dateDebut: "",
  dateFin: "",
};

export default function BureauFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [actif, setActif] = useState(true);

  const [associations, setAssociations] = useState<Association[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);

  const [fetching, setFetching] = useState(isEdit);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  // Load associations once.
  useEffect(() => {
    getAssociations({}, 0, 1000)
      .then((r) => setAssociations(r.content))
      .catch(() => toast.error("Erreur lors du chargement des associations"));
  }, []);

  // Load existing bureau entry in edit mode.
  useEffect(() => {
    if (!id) return;

    getBureauById(Number(id))
      .then((data) => {
        setForm({
          associationId: String(data.associationId),
          memberId: String(data.memberId),
          poste: data.poste,
          description: data.description ?? "",
          dateDebut: data.dateDebut,
          dateFin: data.dateFin ?? "",
        });
        setActif(data.actif);
      })
      .catch(() => {
        toast.error("Poste introuvable");
        navigate("/bureaux");
      })
      .finally(() => setFetching(false));
  }, [id, navigate]);

  // Load members whenever the selected association changes.
  useEffect(() => {
    if (!form.associationId) {
      setMembers([]);
      return;
    }

    memberService
      .getAll({ associationId: Number(form.associationId), page: 0, size: 1000 })
      .then((r) => setMembers(r.content))
      .catch(() => toast.error("Erreur lors du chargement des membres"));
  }, [form.associationId]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAssociationChange = (value: string) => {
    setForm((prev) => ({ ...prev, associationId: value, memberId: "" }));
  };

  /**
   * Close this bureau entry via the dedicated backend action.
   * Sets `actif = false` and `dateFin = today` server-side
   * (BureauController.closeBureau).
   */
  const handleClose = async () => {
    if (!id) return;
    if (!window.confirm("Clôturer ce poste ? Cette action ne peut pas être annulée depuis ce formulaire.")) {
      return;
    }

    setClosing(true);
    try {
      const updated = await closeBureau(Number(id));
      setActif(updated.actif);
      setForm((prev) => ({ ...prev, dateFin: updated.dateFin ?? "" }));
      toast.success("Poste clôturé");
    } catch {
      toast.error("Erreur lors de la clôture du poste");
    } finally {
      setClosing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.poste.trim()) { toast.error("Le poste est obligatoire"); return; }
    if (!form.associationId) { toast.error("Veuillez choisir une association"); return; }
    if (!form.memberId) { toast.error("Veuillez choisir un membre"); return; }
    if (!form.dateDebut) { toast.error("La date de début est obligatoire"); return; }

    // Mirror the backend's @AssertTrue constraint client-side for instant feedback.
    if (form.dateFin && form.dateFin <= form.dateDebut) {
      toast.error("La date de fin doit être postérieure à la date de début");
      return;
    }

    const payload: BureauInput = {
      poste: form.poste.trim(),
      description: form.description.trim() || undefined,
      dateDebut: form.dateDebut,
      dateFin: form.dateFin || undefined,
      // A new entry is always active; existing status is preserved on update
      // and can only be changed via the dedicated "close" action.
      actif: isEdit ? actif : true,
      associationId: Number(form.associationId),
      memberId: Number(form.memberId),
    };

    setLoading(true);
    try {
      if (id) {
        await updateBureau(Number(id), payload);
        toast.success("Poste modifié");
      } else {
        await createBureau(payload);
        toast.success("Poste créé");
      }
      navigate("/bureaux");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error("Ce membre occupe déjà un poste actif dans cette association");
      } else if (axios.isAxiosError(err) && err.response?.status === 400) {
        toast.error("Données invalides — vérifiez les champs du formulaire");
      } else {
        toast.error("Erreur lors de l'enregistrement");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db",
    fontSize: 14, color: "#111827", background: "#fff",
    outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit",
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer", appearance: "none" };

  const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {children}
    </div>
  );

  const SelectWrapper = ({ children }: { children: React.ReactNode }) => (
    <div style={{ position: "relative" }}>
      {children}
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 12, color: "#9ca3af" }}>▼</span>
    </div>
  );

  if (fetching) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
        Chargement...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f0f4ff 0%,#fafafa 100%)", padding: "32px 16px 48px", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 580, margin: "0 auto" }}>

        <button onClick={() => navigate("/bureaux")}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
          onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
        >
          ← Retour au bureau
        </button>

        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "visible" }}>

          <div style={{ background: "linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%)", padding: "24px 32px", borderRadius: "16px 16px 0 0" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>
                {isEdit ? "Modifier le poste" : "Nouveau poste"}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                {isEdit ? `Modification du poste #${id}` : "Ajouter un membre au bureau"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Affectation */}
            <div>
              <div style={sectionTitle}>Affectation</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Association" required>
                  <SelectWrapper>
                    <select
                      style={selectStyle}
                      value={form.associationId}
                      onChange={(e) => handleAssociationChange(e.target.value)}
                    >
                      <option value="">Choisir une association</option>
                      {associations.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </Field>
                <Field label="Membre" required>
                  <SelectWrapper>
                    <select
                      style={{ ...selectStyle, background: !form.associationId ? "#f9fafb" : "#fff", color: !form.associationId ? "#9ca3af" : "#111827" }}
                      value={form.memberId}
                      disabled={!form.associationId}
                      onChange={(e) => updateField("memberId", e.target.value)}
                    >
                      <option value="">
                        {!form.associationId ? "Choisir d'abord une association" : members.length === 0 ? "Aucun membre" : "Choisir un membre"}
                      </option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </Field>
              </div>
            </div>

            {/* Poste */}
            <div>
              <div style={sectionTitle}>Poste</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="Intitulé du poste" required>
                  <input
                    style={inputStyle}
                    type="text"
                    placeholder="Ex: Président"
                    value={form.poste}
                    onChange={(e) => updateField("poste", e.target.value)}
                    list="postes-suggestions"
                  />
                  <datalist id="postes-suggestions">
                    {POSTES_SUGGESTIONS.map((p) => <option key={p} value={p} />)}
                  </datalist>
                </Field>
                <Field label="Description">
                  <textarea
                    style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                    placeholder="Rôle et responsabilités…"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {/* Dates & Statut */}
            <div>
              <div style={sectionTitle}>Période & Statut</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Date de début" required>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.dateDebut}
                    onChange={(e) => updateField("dateDebut", e.target.value)}
                  />
                </Field>

                {isEdit ? (
                  <Field label="Date de fin">
                    <input
                      style={{ ...inputStyle, background: "#f9fafb", color: "#6b7280" }}
                      type="date"
                      value={form.dateFin}
                      readOnly
                    />
                  </Field>
                ) : (
                  <div />
                )}
              </div>

              {isEdit && (
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 10, background: actif ? "#ecfdf5" : "#f3f4f6", border: `1px solid ${actif ? "#a7f3d0" : "#e5e7eb"}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: actif ? "#065f46" : "#374151" }}>
                      {actif ? "Poste actif" : "Poste clôturé"}
                    </div>
                    {!actif && form.dateFin && (
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                        Clôturé le {form.dateFin}
                      </div>
                    )}
                  </div>
                  {actif && (
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={closing}
                      style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", fontSize: 13, fontWeight: 600, cursor: closing ? "not-allowed" : "pointer" }}
                    >
                      {closing ? "Clôture…" : "Clôturer ce poste"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, paddingTop: 8, borderTop: "1px solid #f3f4f6", marginTop: 4 }}>
              <button type="button" onClick={() => navigate("/bureaux")}
                style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                Annuler
              </button>
              <button type="submit" disabled={loading}
                style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: loading ? "#93c5fd" : "#2563eb", color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 2px 8px rgba(29,78,216,0.3)" }}>
                {loading ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer le poste"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 14,
  paddingBottom: 8,
  borderBottom: "1px solid #f3f4f6",
};