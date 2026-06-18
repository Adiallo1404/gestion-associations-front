import { useLocation, useNavigate } from "react-router-dom";

const ROUTE_LABELS: Record<string, string> = {
  "/":                        "Accueil",
  "/associations":            "Associations",
  "/members":                 "Membres",
  "/member-histories":        "Historique membres",
  "/cotisations":             "Cotisations",
  "/cotisation-configs":      "Configs cotisation",
  "/users":                   "Utilisateurs",
  "/roles":                   "Rôles",
  "/user-association-roles":  "User-Assoc-Roles",
  "/emails-envoyes":          "Emails envoyés",
  "/email-codes":             "Code Email",
  "/notifications":           "Notifications",
  "/documents":               "Documents",
  "/liens-partage":           "Liens de partage",
  "/about":                   "À propos",
};

const ACTION_LABELS: Record<string, string> = {
  "new":  "Nouveau",
  "edit": "Modifier",
};

export default function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();

  const segments = location.pathname.split("/").filter(Boolean);

  // Build breadcrumb steps
  const crumbs: { label: string; path: string }[] = [
    { label: "Accueil", path: "/" },
  ];

  segments.forEach((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label =
      ROUTE_LABELS[path] ||
      ACTION_LABELS[seg] ||
      (isNaN(Number(seg)) ? seg : `#${seg}`);
    crumbs.push({ label, path });
  });

  // Single step = we're on the home page, no need to display
  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Fil d'Ariane" style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "10px 0 18px",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.path} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {i > 0 && (
              <span style={{ fontSize: 13, color: "#cbd5e1" }}>›</span>
            )}
            {isLast ? (
              <span style={{
                fontSize: 13, fontWeight: 600, color: "#0f172a",
                background: "#eff6ff", padding: "3px 10px",
                borderRadius: 6, border: "1px solid #dbeafe",
              }}>
                {crumb.label}
              </span>
            ) : (
              <button
                onClick={() => navigate(crumb.path)}
                style={{
                  background: "none", border: "none", padding: "3px 6px",
                  fontSize: 13, color: "#64748b", cursor: "pointer",
                  borderRadius: 6, fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 5,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.color = "#1d4ed8";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                {i === 0 && <span style={{ fontSize: 14 }}>🏠</span>}
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}