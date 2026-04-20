import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAssociations } from "../api/associationService";
import { getUsers } from "../api/userService";
import { getMembers } from "../api/memberService";
import { getCotisations } from "../api/cotisationService";
import { getRoles } from "../api/userAssociationRoleService";
import {
  Chart,
  LineElement, PointElement, LineController,
  DoughnutController, ArcElement,
  CategoryScale, LinearScale,
  Legend, Tooltip, Filler,
} from "chart.js";

Chart.register(
  LineElement, PointElement, LineController,
  DoughnutController, ArcElement,
  CategoryScale, LinearScale,
  Legend, Tooltip, Filler
);

const MENU_SECTIONS = [
  {
    title: "Principal",
    items: [
      { label: "🏠 Accueil",            path: "/" },
      { label: "🏛️ Associations",       path: "/associations" },
      { label: "👥 Membres",            path: "/members" },
      { label: "🕐 Historique membres", path: "/member-histories" },
    ],
  },
  {
    title: "Finances",
    items: [
      { label: "💰 Cotisations",        path: "/cotisations" },
      { label: "⚙️ Configs cotisation", path: "/cotisation-configs" },
    ],
  },
  {
    title: "Gestion",
    items: [
      { label: "👤 Utilisateurs",       path: "/users" },
      { label: "🛡️ Rôles",             path: "/roles" },
      { label: "🔗 User-Assoc-Roles",   path: "/user-association-roles" },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "📧 Emails envoyés",     path: "/emails-envoyes" },
      { label: "🔑 Code Email",         path: "/email-codes" },
      { label: "🔔 Notifications",      path: "/notifications" },
    ],
  },
  {
    title: "Autres",
    items: [
      { label: "📄 Documents",          path: "/documents" },
      { label: "🔗 Liens de partage",   path: "/liens-partage" },
    ],
  },
];

const QUICK_ACTIONS = [
  { label: "🛡️ Assigner rôle",   path: "/user-association-roles/new" },
  { label: "👥 Ajouter membre",  path: "/members/new" },
  { label: "💰 Cotisation",       path: "/cotisations/new" },
  { label: "📧 Email",           path: "/emails-envoyes/new" },
  { label: "👤 Utilisateur",     path: "/users/new" },
  { label: "📄 Document",        path: "/documents/new" },
];

const AVATAR_COLORS = [
  { bg: "#eff6ff", color: "#1d4ed8" },
  { bg: "#f0fdf4", color: "#16a34a" },
  { bg: "#fffbeb", color: "#d97706" },
  { bg: "#f5f3ff", color: "#7c3aed" },
  { bg: "#fef2f2", color: "#dc2626" },
];

const NOTIFS = [
  { icon: "👤", bg: "#eff6ff", text: "Nouveau membre ajouté à ADEMA",  time: "Il y a 30 min" },
  { icon: "💰", bg: "#f0fdf4", text: "Cotisation validée — Ali BEN",    time: "Il y a 2h" },
  { icon: "📧", bg: "#fffbeb", text: "Email envoyé à 12 membres",       time: "Hier, 14h30" },
  { icon: "⚠️", bg: "#fef2f2", text: "3 cotisations en retard",         time: "Hier" },
];

export default function DashboardPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const lineRef   = useRef<HTMLCanvasElement>(null);
  const pieRef    = useRef<HTMLCanvasElement>(null);
  const lineChart = useRef<Chart | null>(null);
  const pieChart  = useRef<Chart | null>(null);

  const [stats, setStats] = useState([
    { label: "Associations",   value: 0, sub: "enregistrées", accent: "#1d4ed8", iconBg: "#eff6ff", icon: "🏛️", trend: "+3",  up: true  },
    { label: "Utilisateurs",   value: 0, sub: "inscrits",     accent: "#16a34a", iconBg: "#f0fdf4", icon: "👤", trend: "+5",  up: true  },
    { label: "Membres",        value: 0, sub: "au total",     accent: "#d97706", iconBg: "#fffbeb", icon: "👥", trend: "+12", up: true  },
    { label: "Cotisations",    value: 0, sub: "enregistrées", accent: "#dc2626", iconBg: "#fef2f2", icon: "💰", trend: "-2",  up: false },
    { label: "Rôles assignés", value: 0, sub: "affectations", accent: "#7c3aed", iconBg: "#f5f3ff", icon: "🛡️", trend: "+1",  up: true  },
  ]);

  const [recentRoles, setRecentRoles] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  const initials = (name?: string) =>
    name ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "??";

  useEffect(() => {
    const load = async () => {
      try {
        const [assocRes, usersRes, membersRes, cotisRes, rolesRes] =
          await Promise.allSettled([
            getAssociations(0, 1),
            getUsers({}, 0, 1),
            getMembers({ page: 0, size: 1 }),
            getCotisations({}, 0, 1),
            getRoles(0, 5),
          ]);

        const total = (r: PromiseSettledResult<any>) =>
          r.status === "fulfilled" ? (r.value?.totalElements ?? 0) : 0;

        setStats((prev) => prev.map((s, i) => ({
          ...s,
          value: [
            total(assocRes),
            total(usersRes),
            total(membersRes),
            total(cotisRes),
            total(rolesRes),
          ][i],
        })));

        if (rolesRes.status === "fulfilled") {
          setRecentRoles(rolesRes.value?.content?.slice(0, 5) ?? []);
        }
      } catch (e) {
        console.error("Erreur dashboard", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (lineRef.current) {
      lineChart.current?.destroy();
      lineChart.current = new Chart(lineRef.current, {
        type: "line",
        data: {
          labels: ["Nov", "Déc", "Jan", "Fév", "Mar", "Avr"],
          datasets: [
            {
              label: "Membres",
              data: [8, 10, 13, 15, 17, stats[2].value || 19],
              borderColor: "#1d4ed8",
              backgroundColor: "rgba(29,78,216,0.08)",
              borderWidth: 2,
              pointBackgroundColor: "#1d4ed8",
              pointRadius: 4,
              tension: 0.4,
              fill: true,
            },
            {
              label: "Cotisations",
              data: [5, 7, 8, 10, 13, stats[3].value || 11],
              borderColor: "#dc2626",
              backgroundColor: "rgba(220,38,38,0.05)",
              borderWidth: 2,
              pointBackgroundColor: "#dc2626",
              pointRadius: 4,
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "top", labels: { font: { size: 13 }, boxWidth: 14 } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 13 } } },
            y: { grid: { color: "#f1f5f9" }, ticks: { font: { size: 13 } } },
          },
        },
      });
    }

    if (pieRef.current) {
      pieChart.current?.destroy();
      pieChart.current = new Chart(pieRef.current, {
        type: "doughnut",
        data: {
          labels: stats.map((s) => s.label),
          datasets: [{
            data: stats.map((s) => s.value),
            backgroundColor: stats.map((s) => s.accent),
            borderWidth: 0,
            hoverOffset: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { font: { size: 12 }, boxWidth: 12, padding: 8 },
            },
          },
          cutout: "65%",
        },
      });
    }

    return () => {
      lineChart.current?.destroy();
      pieChart.current?.destroy();
    };
  }, [loading, stats]);

  return (
    <div style={s.layout}>

      {/* ── SIDEBAR ── */}
      <aside style={s.sidebar}>
        <div style={s.sbBrand}>
          <div style={s.sbLogo}>
            <div style={s.sbDot}>G</div>
            <span style={s.sbName}>GestAssoc</span>
          </div>
        </div>
        <nav style={s.sbNav}>
          {MENU_SECTIONS.map((section) => (
            <div key={section.title}>
              <div style={s.sbSection}>{section.title}</div>
              {section.items.map((item) => {
                const active =
                  location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path));
                return (
                  <div
                    key={item.path}
                    style={{ ...s.mi, ...(active ? s.miActive : {}) }}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <main style={s.main}>

        <div style={s.topBar}>
          <div>
            <div style={s.topTitle}>Tableau de bord</div>
            <div style={s.topSub}>
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long", year: "numeric",
                month: "long", day: "numeric",
              })}
            </div>
          </div>
          <div style={s.topRight}>
            <div style={s.notifBtn}>
              🔔
              <div style={s.notifDot} />
            </div>
            <button style={s.addBtn} onClick={() => navigate("/associations/new")}>
              + Nouvelle association
            </button>
          </div>
        </div>

        {loading ? (
          <div style={s.loadWrap}>
            <p style={{ color: "#64748b", fontSize: 16 }}>Chargement des données…</p>
          </div>
        ) : (
          <>
            {/* ── Stats ── */}
            <div style={s.statsGrid}>
              {stats.map((stat) => (
                <div key={stat.label} style={s.sc}>
                  <div style={{ ...s.scAccent, background: stat.accent }} />
                  <div style={s.scTop}>
                    <div style={{ ...s.scIcon, background: stat.iconBg }}>{stat.icon}</div>
                    <div style={{
                      ...s.scTrend,
                      background: stat.up ? "#dcfce7" : "#fee2e2",
                      color: stat.up ? "#15803d" : "#dc2626",
                    }}>
                      {stat.up ? "↑" : "↓"} {stat.trend}
                    </div>
                  </div>
                  <div style={s.scVal}>{stat.value.toLocaleString("fr-FR")}</div>
                  <div style={s.scLbl}>{stat.label}</div>
                  <div style={s.scSub}>{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* ── Graphique + Notifications ── */}
            <div style={s.row2}>
              <div style={s.card}>
                <div style={s.cardHdr}>
                  <span style={s.cardTitle}>📈 Évolution des membres</span>
                  <button style={s.seeAll}>Ce mois →</button>
                </div>
                <div style={{ height: 200, position: "relative", marginTop: 8 }}>
                  <canvas ref={lineRef} />
                </div>
              </div>
              <div style={s.card}>
                <div style={s.cardHdr}>
                  <span style={s.cardTitle}>🔔 Activité récente</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {NOTIFS.map((n, i) => (
                    <div key={i} style={s.notifItem}>
                      <div style={{ ...s.notifIc, background: n.bg }}>{n.icon}</div>
                      <div>
                        <div style={s.notifTxt}>{n.text}</div>
                        <div style={s.notifTime}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Tableau + Accès rapides ── */}
            <div style={s.row3}>
              <div style={s.card}>
                <div style={s.cardHdr}>
                  <span style={s.cardTitle}>🧾 Derniers rôles assignés</span>
                  <button style={s.seeAll} onClick={() => navigate("/user-association-roles")}>
                    Voir tout →
                  </button>
                </div>
                {recentRoles.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: 15, textAlign: "center", padding: "16px 0" }}>
                    Aucune affectation.
                  </p>
                ) : (
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Utilisateur</th>
                        <th style={s.th}>Association</th>
                        <th style={s.th}>Rôle</th>
                        <th style={s.th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRoles.map((r, i) => {
                        const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
                        return (
                          <tr key={r.id ?? i}>
                            <td style={s.td}>
                              <div style={s.ucell}>
                                <div style={{ ...s.av, background: av.bg, color: av.color }}>
                                  {initials(r.userName)}
                                </div>
                                <div style={s.uname}>{r.userName ?? `Utilisateur ${r.id}`}</div>
                              </div>
                            </td>
                            <td style={{ ...s.td, color: "#64748b" }}>
                              {r.associationName ?? "—"}
                            </td>
                            <td style={s.td}>
                              <span style={{ ...s.bdg, background: av.bg, color: av.color }}>
                                {r.roleName ?? "—"}
                              </span>
                            </td>
                            <td style={s.td}>
                              <button style={s.det} onClick={() => navigate("/user-association-roles")}>
                                Détail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={s.card}>
                <div style={s.cardHdr}>
                  <span style={s.cardTitle}>🎯 Accès rapides</span>
                </div>
                <div style={s.qgrid}>
                  {QUICK_ACTIONS.map((q) => (
                    <button
                      key={q.path}
                      style={s.qbtn}
                      onMouseEnter={(e) => {
                        const b = e.currentTarget as HTMLButtonElement;
                        b.style.background = "#eff6ff";
                        b.style.borderColor = "#bfdbfe";
                        b.style.color = "#1d4ed8";
                      }}
                      onMouseLeave={(e) => {
                        const b = e.currentTarget as HTMLButtonElement;
                        b.style.background = "#f8fafc";
                        b.style.borderColor = "#e2e8f0";
                        b.style.color = "#334155";
                      }}
                      onClick={() => navigate(q.path)}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ ...s.cardTitle, marginBottom: 10 }}>📊 Répartition</div>
                  <div style={{ height: 170, position: "relative" }}>
                    <canvas ref={pieRef} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  layout:    { display: "flex", width: "100%", height: "100vh", margin: 0, padding: 0, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", background: "#f1f5f9", overflow: "hidden" },
  sidebar:   { width: 255, background: "#0f172a", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto", height: "100%" },
  main:      { flex: 1, overflowY: "auto", overflowX: "hidden", padding: "24px 32px", height: "100%" },
  sbBrand:   { padding: "22px 18px 18px", borderBottom: "1px solid #1e293b" },
  sbLogo:    { display: "flex", alignItems: "center", gap: 10 },
  sbDot:     { width: 36, height: 36, background: "#2563eb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 },
  sbName:    { fontSize: 17, fontWeight: 600, color: "#f1f5f9" },
  sbNav:     { padding: "14px 10px", flex: 1 },
  sbSection: { fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: ".08em", padding: "14px 8px 6px", fontWeight: 600 },
  mi:        { display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 7, cursor: "pointer", color: "#94a3b8", fontSize: 14, marginBottom: 2 },
  miActive:  { background: "#1d4ed8", color: "#fff" },
  topBar:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  topTitle:  { fontSize: 26, fontWeight: 700, color: "#0f172a" },
  topSub:    { fontSize: 14, color: "#64748b", marginTop: 3, textTransform: "capitalize" },
  topRight:  { display: "flex", alignItems: "center", gap: 12 },
  notifBtn:  { position: "relative", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18 },
  notifDot:  { position: "absolute", top: 6, right: 6, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", border: "2px solid #fff" },
  addBtn:    { background: "#1d4ed8", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  loadWrap:  { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 14, marginBottom: 18 },
  sc:        { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px", position: "relative", overflow: "hidden" },
  scAccent:  { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },
  scTop:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  scIcon:    { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  scTrend:   { display: "flex", alignItems: "center", gap: 3, fontSize: 13, fontWeight: 600, padding: "3px 8px", borderRadius: 5 },
  scVal:     { fontSize: 32, fontWeight: 700, color: "#0f172a", lineHeight: 1 },
  scLbl:     { fontSize: 14, fontWeight: 600, color: "#475569", marginTop: 5 },
  scSub:     { fontSize: 13, color: "#94a3b8", marginTop: 3 },

  row2:      { display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 16 },
  row3:      { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 24 },
  card:      { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 22px" },
  cardHdr:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: ".04em" },
  seeAll:    { fontSize: 13, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 600 },

  table:     { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th:        { textAlign: "left", color: "#94a3b8", fontWeight: 600, padding: "0 0 10px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid #f1f5f9" },
  td:        { padding: "10px 0", borderBottom: "1px solid #f8fafc", color: "#334155", verticalAlign: "middle", fontSize: 14 },
  ucell:     { display: "flex", alignItems: "center", gap: 10 },
  av:        { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  uname:     { fontWeight: 600, color: "#0f172a", fontSize: 14 },
  bdg:       { padding: "4px 10px", borderRadius: 5, fontSize: 12, fontWeight: 600, letterSpacing: ".03em" },
  det:       { background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 12px", fontSize: 13, color: "#64748b", cursor: "pointer" },

  notifItem: { display: "flex", alignItems: "flex-start", gap: 12, padding: 12, background: "#f8fafc", borderRadius: 9 },
  notifIc:   { width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
  notifTxt:  { fontSize: 14, color: "#334155", fontWeight: 500, lineHeight: 1.4 },
  notifTime: { fontSize: 12, color: "#94a3b8", marginTop: 3 },

  qgrid:     { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 },
  qbtn:      { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 8px", fontSize: 13, color: "#334155", cursor: "pointer", textAlign: "center", fontWeight: 500 },
};