import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate } from "react-router-dom";
import { getAssociations } from "../api/associationService";
import type { Association } from "../types/association";

export default function SuiviCotisationSelectPage() {
  const navigate = useNavigate();

  const [associations, setAssociations] = useState<Association[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssociations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getAssociations({}, 0, 1000);
      setAssociations(response.content ?? []);
    } catch (loadError) {
      console.error("Failed to load associations", loadError);
      setAssociations([]);
      setError("Erreur lors du chargement des associations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssociations();
  }, [loadAssociations]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📋 Suivi des cotisations</h1>
            <p style={styles.subtitle}>
              Choisissez une association pour consulter le suivi des cotisations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            style={styles.backButton}
          >
            ← Retour
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.card}>
          {isLoading ? (
            <div style={styles.stateBox}>Chargement des associations...</div>
          ) : associations.length === 0 ? (
            <div style={styles.stateBox}>Aucune association trouvée.</div>
          ) : (
            <div style={styles.list}>
              {associations.map((association) => (
                <button
                  key={association.id}
                  type="button"
                  onClick={() =>
                    navigate(`/cotisations/suivi/${association.id}`)
                  }
                  style={styles.associationButton}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.borderColor = "#3b82f6";
                    event.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.borderColor = "#e5e7eb";
                    event.currentTarget.style.background = "#fff";
                  }}
                >
                  <div>
                    <div style={styles.associationName}>
                      🏛️ {association.name}
                    </div>

                    <div style={styles.associationMeta}>
                      Association #{association.id}
                    </div>
                  </div>

                  <span style={styles.arrow}>→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "32px 16px",
    fontFamily: "system-ui, sans-serif",
  },
  container: {
    maxWidth: 720,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#111827",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 14,
    color: "#6b7280",
  },
  backButton: {
    padding: "8px 16px",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
    whiteSpace: "nowrap",
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#dc2626",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 16,
    fontSize: 14,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  associationButton: {
    width: "100%",
    padding: "16px 18px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.15s ease",
  },
  associationName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
  },
  associationMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#94a3b8",
  },
  arrow: {
    fontSize: 18,
    color: "#3b82f6",
    fontWeight: 700,
  },
  stateBox: {
    textAlign: "center",
    padding: 48,
    color: "#6b7280",
    fontSize: 15,
  },
};