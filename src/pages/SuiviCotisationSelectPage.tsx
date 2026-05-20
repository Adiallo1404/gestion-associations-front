import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAssociations } from "../api/associationService";

export default function SuiviCotisationSelectPage() {
  const navigate = useNavigate();
  const [associations, setAssociations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAssociations(0, 1000)
      .then(res => setAssociations(res.content || []))
      .catch(() => setAssociations([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          📋 Suivi des cotisations — Choisir une association
        </h2>
        <button
          onClick={() => window.history.back()}
          style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
        >
          ← Retour
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>Chargement…</div>
      ) : associations.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>Aucune association trouvée.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {associations.map(a => (
            <button
              key={a.id}
              onClick={() => navigate(`/cotisations/suivi/${a.id}`)}
              style={{
                padding: "16px 20px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                textAlign: "left",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
                color: "#0f172a",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#3b82f6")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
            >
              🏛️ {a.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}