import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createBureau, getBureauById, updateBureau } from "../api/bureauService";
import { getAssociations } from "../api/associationService";
import { memberService } from "../api/memberService";
import { toast } from "react-toastify";

const POSTES_SUGGESTIONS = [
  "Président", "Vice-Président", "Trésorier", "Trésorier adjoint",
  "Secrétaire", "Secrétaire général", "Commissaire aux comptes",
  "Chargé de communication", "Responsable logistique",
];

export default function BureauFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // ── Champs contrôlés (selects uniquement)
  const [associationId, setAssociationId] = useState("");
  const [memberId, setMemberId]           = useState("");
  const [poste, setPoste]                 = useState("");
  const [actif, setActif]                 = useState(true);

  // ── Champs NON contrôlés → zéro re-render → zéro perte de focus
  const datDebutRef = useRef<HTMLInputElement>(null);
  const dateFinRef  = useRef<HTMLInputElement>(null);
  const descRef     = useRef<HTMLTextAreaElement>(null);

  const [associations, setAssociations] = useState<any[]>([]);
  const [members, setMembers]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    getAssociations(0, 1000).then(r => setAssociations(r.content));
    if (id) {
      getBureauById(Number(id)).then(data => {
        setAssociationId(String(data.associationId));
        setMemberId(String(data.memberId));
        setPoste(data.poste);
        setActif(data.actif);
        setTimeout(() => {
          if (datDebutRef.current) datDebutRef.current.value = data.dateDebut || "";
          if (dateFinRef.current)  dateFinRef.current.value  = data.dateFin   || "";
          if (descRef.current)     descRef.current.value     = data.description || "";
        }, 0);
      });
    }
  }, [id]);

  useEffect(() => {
    if (associationId) {
      memberService.getAll({ associationId, page: 0, size: 1000 })
        .then(r => setMembers(r.content));
    } else {
      setMembers([]);
    }
  }, [associationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateDebut = datDebutRef.current?.value || "";
    const dateFin   = dateFinRef.current?.value  || "";
    const description = descRef.current?.value   || "";

    if (!poste)         { toast.error("⚠️ Poste obligatoire"); return; }
    if (!associationId) { toast.error("⚠️ Choisir une association"); return; }
    if (!memberId)      { toast.error("⚠️ Choisir un membre"); return; }
    if (!dateDebut)     { toast.error("⚠️ Date de début obligatoire"); return; }

    const payload = {
      poste, description,
      dateDebut,
      dateFin: dateFin || null,
      actif,
      associationId: Number(associationId),
      memberId:      Number(memberId),
    };

    setLoading(true);
    try {
      if (id) {
        await updateBureau(Number(id), payload);
        toast.success("✅ Poste modifié !");
      } else {
        await createBureau(payload);
        toast.success("✅ Poste créé !");
      }
      navigate("/bureaux");
    } catch {
      toast.error("❌ Erreur lors de l'enregistrement");
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
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏢</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>
                  {isEdit ? "Modifier le poste" : "Nouveau poste"}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                  {isEdit ? `Modification du poste #${id}` : "Ajouter un membre au bureau"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Affectation */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>Affectation</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Association" required>
                  <SelectWrapper>
                    <select style={selectStyle} value={associationId}
                      onChange={e => { setAssociationId(e.target.value); setMemberId(""); }}>
                      <option value="">Choisir une association</option>
                      {associations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>
                <Field label="Membre" required>
                  <SelectWrapper>
                    <select style={{ ...selectStyle, background: !associationId ? "#f9fafb" : "#fff", color: !associationId ? "#9ca3af" : "#111827" }}
                      value={memberId} disabled={!associationId}
                      onChange={e => setMemberId(e.target.value)}>
                      <option value="">{!associationId ? "Choisir d'abord une association" : members.length === 0 ? "Aucun membre" : "Choisir un membre"}</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>
              </div>
            </div>

            {/* Poste */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>Poste</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="Intitulé du poste" required>
                  <input style={inputStyle} type="text" placeholder="Ex: Président"
                    value={poste} onChange={e => setPoste(e.target.value)}
                    list="postes-suggestions" />
                  <datalist id="postes-suggestions">
                    {POSTES_SUGGESTIONS.map(p => <option key={p} value={p} />)}
                  </datalist>
                </Field>
                <Field label="Description">
                  <textarea ref={descRef}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                    placeholder="Rôle et responsabilités…"
                    defaultValue="" />
                </Field>
              </div>
            </div>

            {/* Dates & Statut */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>Période & Statut</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                {/* ✅ NON CONTRÔLÉ → pas de re-render → pas de perte de focus */}
                <Field label="Date de début" required>
                  <input
                    ref={datDebutRef}
                    style={inputStyle}
                    type="date"
                    defaultValue=""
                  />
                </Field>

                <Field label="Date de fin">
                  <input
                    ref={dateFinRef}
                    style={inputStyle}
                    type="date"
                    defaultValue=""
                  />
                </Field>

                <Field label="Statut">
                  <SelectWrapper>
                    <select style={selectStyle} value={String(actif)}
                      onChange={e => setActif(e.target.value === "true")}>
                      <option value="true">✅ Actif</option>
                      <option value="false">🔒 Clôturé</option>
                    </select>
                  </SelectWrapper>
                </Field>
              </div>
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
                style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: loading ? "#93c5fd" : "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 2px 8px rgba(29,78,216,0.3)" }}>
                {loading ? "Enregistrement…" : isEdit ? "💾 Mettre à jour" : "💾 Créer le poste"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}