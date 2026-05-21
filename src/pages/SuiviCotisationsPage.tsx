import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  getSuiviCotisations,
  getMembresNonCotisants,
} from "../api/cotisationService";
import type { MembreCotisationStatus } from "../types/cotisation";
import { getAssociations } from "../api/associationService";

type Onglet = "tous" | "non-cotisants";

const STATUT_LABELS: Record<string, string> = {
  PAYEE:      "✅ Payée",
  EN_ATTENTE: "⏳ En attente",
  EN_RETARD:  "🔴 En retard",
  ANNULEE:    "⚫ Annulée",
};

const STATUT_COLORS: Record<string, string> = {
  PAYEE:      "#dcfce7",
  EN_ATTENTE: "#fef9c3",
  EN_RETARD:  "#fee2e2",
  ANNULEE:    "#f3f4f6",
};

const STATUT_TEXT: Record<string, string> = {
  PAYEE:      "#15803d",
  EN_ATTENTE: "#92400e",
  EN_RETARD:  "#dc2626",
  ANNULEE:    "#6b7280",
};

export default function SuiviCotisationsPage() {
  const { associationId } = useParams<{ associationId: string }>();

  const [onglet, setOnglet]           = useState<Onglet>("tous");
  const [membres, setMembres]         = useState<MembreCotisationStatus[]>([]);
  const [assocName, setAssocName]     = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const [rechercheMembre, setRechercheMembre] = useState("");

  const today = new Date();
  const defaultDebut = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const defaultFin = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${lastDay}`;

  const [debut, setDebut] = useState(defaultDebut);
  const [fin, setFin]     = useState(defaultFin);

  useEffect(() => {
    const loadAssoc = async () => {
      try {
        const data = await getAssociations(0, 1000);
        const found = (data.content || []).find((a: any) => a.id === Number(associationId));
        setAssocName(found?.name || `Association #${associationId}`);
      } catch {
        setAssocName(`Association #${associationId}`);
      }
    };
    if (associationId) loadAssoc();
  }, [associationId]);

  useEffect(() => {
    if (!associationId || !debut || !fin) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = onglet === "tous"
          ? await getSuiviCotisations(Number(associationId), debut, fin)
          : await getMembresNonCotisants(Number(associationId), debut, fin);
        setMembres(data);
      } catch {
        setError("Erreur lors du chargement des données.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [associationId, debut, fin, onglet]);

  const membresFiltres = useMemo(() => {
    const q = rechercheMembre.trim().toLowerCase();
    if (!q) return membres;
    return membres.filter(m =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      `${m.lastName} ${m.firstName}`.toLowerCase().includes(q)
    );
  }, [membres, rechercheMembre]);

  const total      = membresFiltres.length;
  const nbPayes    = membresFiltres.filter(m => m.aCotise).length;
  const nbEnRetard = membresFiltres.filter(m => m.enRetard).length;
  const nbAttente  = membresFiltres.filter(m => !m.aCotise && !m.enRetard).length;

  const filtreActif = rechercheMembre.trim().length > 0;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 16px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          📋 Suivi des cotisations — {assocName}
        </h2>
        <button
          onClick={() => window.history.back()}
          style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
        >
          ← Retour
        </button>
      </div>

      {/* FILTRES */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>
            Début de période
          </label>
          <input
            type="date"
            value={debut}
            onChange={e => setDebut(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>
            Fin de période
          </label>
          <input
            type="date"
            value={fin}
            onChange={e => setFin(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
          />
        </div>

        <div style={{ width: 1, height: 36, background: "#e5e7eb", alignSelf: "flex-end" }} />

        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>
            Rechercher un membre
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 16, pointerEvents: "none" }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Nom ou prénom…"
              value={rechercheMembre}
              onChange={e => setRechercheMembre(e.target.value)}
              style={{ width: "100%", padding: "8px 12px 8px 34px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
            />
            {filtreActif && (
              <button
                onClick={() => setRechercheMembre("")}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, lineHeight: 1 }}
                title="Effacer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BADGE filtre actif */}
      {filtreActif && (
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>Résultats pour :</span>
          <span style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: 13, fontWeight: 600, padding: "3px 10px", borderRadius: 999 }}>
            "{rechercheMembre}"
          </span>
          <span style={{ fontSize: 13, color: "#6b7280" }}>— {total} membre{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* STATISTIQUES */}
      {onglet === "tous" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total membres",  value: total,      bg: "#f0f9ff", color: "#0369a1" },
            { label: "✅ Cotisé",      value: nbPayes,    bg: "#dcfce7", color: "#15803d" },
            { label: "⏳ En attente",  value: nbAttente,  bg: "#fef9c3", color: "#92400e" },
            { label: "🔴 En retard",   value: nbEnRetard, bg: "#fee2e2", color: "#dc2626" },
          ].map(({ label, value, bg, color }) => (
            <div key={label} style={{ background: bg, borderRadius: 10, padding: "14px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ONGLETS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["tous", "non-cotisants"] as Onglet[]).map(tab => (
          <button
            key={tab}
            onClick={() => setOnglet(tab)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid",
              borderColor: onglet === tab ? "#3b82f6" : "#d1d5db",
              background: onglet === tab ? "#3b82f6" : "#fff",
              color: onglet === tab ? "#fff" : "#374151",
              fontWeight: onglet === tab ? 600 : 400,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {tab === "tous" ? "👥 Tous les membres" : "⚠️ Non cotisants"}
          </button>
        ))}
      </div>

      {/* ERREUR */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* CHARGEMENT */}
      {loading && (
        <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>Chargement...</div>
      )}

      {/* TABLEAU */}
      {!loading && !error && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          {membresFiltres.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>
              {filtreActif
                ? `Aucun membre ne correspond à "${rechercheMembre}".`
                : onglet === "non-cotisants"
                  ? "✅ Tous les membres ont cotisé !"
                  : "Aucun membre trouvé."
              }
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["Membre", "Email", "Téléphone", "Statut", "Montant", "Échéance", "Référence"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {membresFiltres.map((m, i) => {
                  const statut = m.statut ?? "EN_RETARD";
                  return (
                    <tr
                      key={m.memberId}
                      style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                    >
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#111827" }}>
                        {m.firstName} {m.lastName}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>
                        {m.email}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>
                        {m.phone}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: STATUT_COLORS[statut] ?? "#f3f4f6",
                          color: STATUT_TEXT[statut] ?? "#6b7280",
                        }}>
                          {m.statut ? STATUT_LABELS[m.statut] : "❌ Aucune cotisation"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#111827" }}>
                        {m.montant != null ? `${Number(m.montant).toFixed(2)} ${m.devise ?? "€"}` : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: m.enRetard ? "#dc2626" : "#6b7280", fontWeight: m.enRetard ? 600 : 400 }}>
                        {m.dateEcheance ?? "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>
                        {m.referencePaiement ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}