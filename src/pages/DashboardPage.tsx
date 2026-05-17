import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAssociations } from "../api/associationService";
import { getUsers, getMyProfile } from "../api/userService";
import { getMembers } from "../api/memberService";
import { getCotisations } from "../api/cotisationService";
import { getRoles } from "../api/userAssociationRoleService";
import { useRole } from "../hooks/useRole";
import { useAuth } from '../context/AuthContext';
import { useWindowSize } from "../hooks/useWindowSize";
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

const ALL_MENU_SECTIONS = [
  {
    title: "Principal",
    items: [
      { label: "🏠 Accueil",            path: "/",                 roles: ['SUPER_ADMIN', 'ADMIN', 'USER'] },
      { label: "🏛️ Associations",       path: "/associations",     roles: ['SUPER_ADMIN', 'ADMIN', 'USER'] },
      { label: "👥 Membres",            path: "/members",          roles: ['SUPER_ADMIN', 'ADMIN', 'USER'] },
      { label: "🕐 Historique membres", path: "/member-histories", roles: ['SUPER_ADMIN', 'ADMIN', 'USER'] },
    ],
  },
  {
    title: "Finances",
    items: [
      { label: "💰 Cotisations",        path: "/cotisations",        roles: ['SUPER_ADMIN', 'ADMIN', 'USER'] },
      { label: "⚙️ Configs cotisation", path: "/cotisation-configs", roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    title: "Gestion",
    items: [
      { label: "👤 Utilisateurs",      path: "/users",                  roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: "🛡️ Rôles",            path: "/roles",                  roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: "🔗 User-Assoc-Roles",  path: "/user-association-roles", roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "📧 Emails envoyés", path: "/emails-envoyes", roles: ['SUPER_ADMIN', 'ADMIN', 'USER'] },
      { label: "🔑 Code Email",     path: "/email-codes",    roles: ['SUPER_ADMIN', 'ADMIN', 'USER'] },
      { label: "🔔 Notifications",  path: "/notifications",  roles: ['SUPER_ADMIN', 'ADMIN', 'USER'] },
    ],
  },
  {
    title: "Autres",
    items: [
      { label: "📄 Documents",        path: "/documents",     roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: "🔗 Liens de partage", path: "/liens-partage", roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: "ℹ️ À propos",         path: "/about",         roles: ['SUPER_ADMIN', 'ADMIN', 'USER'] },
    ],
  },
];

const ALL_QUICK_ACTIONS = [
  { label: "🛡️ Assigner rôle",  path: "/user-association-roles/new", roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: "👥 Ajouter membre", path: "/members/new",                 roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: "💰 Cotisation",      path: "/cotisations/new",             roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: "📧 Email",          path: "/emails-envoyes/new",          roles: ['SUPER_ADMIN', 'ADMIN', 'USER'] },
  { label: "👤 Utilisateur",    path: "/users/new",                   roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: "📄 Document",       path: "/documents/new",               roles: ['SUPER_ADMIN', 'ADMIN'] },
];

const AVATAR_COLORS = [
  { bg: "#eff6ff", color: "#1d4ed8" },
  { bg: "#f0fdf4", color: "#16a34a" },
  { bg: "#fffbeb", color: "#d97706" },
  { bg: "#f5f3ff", color: "#7c3aed" },
  { bg: "#fef2f2", color: "#dc2626" },
];

const ROLE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  SUPER_ADMIN: { label: "Super Admin", bg: "#7c3aed", color: "#fff" },
  ADMIN:       { label: "Admin",       bg: "#1d4ed8", color: "#fff" },
  USER:        { label: "Utilisateur", bg: "#16a34a", color: "#fff" },
};

export default function DashboardPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const lineRef   = useRef<HTMLCanvasElement>(null);
  const pieRef    = useRef<HTMLCanvasElement>(null);
  const lineChart = useRef<Chart | null>(null);
  const pieChart  = useRef<Chart | null>(null);

  const { role, isSuperAdmin, isAdminOrSuperAdmin } = useRole();
  const { user } = useAuth();
  const { isMobile, isTablet } = useWindowSize();

  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  // ✅ ID de l'association de l'utilisateur connecté (null = pas encore chargé)
  const [myAssociationId, setMyAssociationId] = useState<number | null | undefined>(undefined);

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'ME';

  const menuSections = ALL_MENU_SECTIONS
    .map(section => ({
      ...section,
      items: section.items.filter(item => role && item.roles.includes(role)),
    }))
    .filter(section => section.items.length > 0);

  const quickActions = ALL_QUICK_ACTIONS.filter(
    action => role && action.roles.includes(role)
  );

  const roleBadge = role ? ROLE_BADGES[role] : null;

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // ✅ ÉTAPE 1 : charger l'associationId du profil connecté
  useEffect(() => {
    const loadProfile = async () => {
      if (isSuperAdmin) {
        // SUPER_ADMIN : pas de filtre d'association
        setMyAssociationId(null);
        return;
      }
      try {
        const me = await getMyProfile();
        setMyAssociationId(me.associationId ?? null);
      } catch (e) {
        console.error("Impossible de récupérer le profil", e);
        setMyAssociationId(null);
      }
    };
    if (role) loadProfile();
  }, [role, isSuperAdmin]);

  // ✅ ÉTAPE 2 : charger les stats une fois myAssociationId résolu
  useEffect(() => {
    // Attendre que myAssociationId soit défini (undefined = pas encore chargé)
    if (myAssociationId === undefined) return;

    const load = async () => {
      try {
        // ✅ Filtre par association pour ADMIN, aucun filtre pour SUPER_ADMIN
        const assocFilter = myAssociationId ? { associationId: myAssociationId } : {};

        const promises: Promise<any>[] = [
          // Associations : SUPER_ADMIN voit tout, ADMIN voit la sienne, USER voit 0
          isSuperAdmin
            ? getAssociations(0, 1)
            : isAdminOrSuperAdmin && myAssociationId
              ? getAssociations(0, 1) // 1 seule association pour l'admin
              : Promise.resolve({ totalElements: 0 }),

          // Utilisateurs : filtrés par association pour ADMIN
          isAdminOrSuperAdmin
            ? getUsers(assocFilter, 0, 1)
            : Promise.resolve({ totalElements: 0 }),

          // Membres : filtrés par association
          getMembers({ page: 0, size: 1, ...assocFilter }),

          // Cotisations : filtrées par association
          getCotisations(assocFilter, 0, 1),

          // Rôles : filtrés par association
          isAdminOrSuperAdmin
            ? getRoles(0, 5, myAssociationId ?? undefined)
            : Promise.resolve({ totalElements: 0, content: [] }),
        ];

        const [assocRes, usersRes, membersRes, cotisRes, rolesRes] =
          await Promise.allSettled(promises);

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
  }, [myAssociationId]);

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

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // ✅ Filtrer les stats selon le rôle
  const visibleStats = stats.filter((_, i) => {
    if (isSuperAdmin) return true;                        // SUPER_ADMIN : tout
    if (isAdminOrSuperAdmin) return i !== 0;             // ADMIN : sans "Associations"
    return i === 2 || i === 3;                           // USER : Membres + Cotisations
  });

  return (
    <div style={{
      display: "flex", width: "100%", minHeight: "100vh",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      background: "#f1f5f9", position: "relative",
    }}>

      {isMobile && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 52,
          background: "#0f172a", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 16px", zIndex: 200,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, background: "#2563eb", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>G</div>
            <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>GestAssoc</span>
          </div>
          <button
            style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", padding: 4 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
        </div>
      )}

      {isMobile && sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 150 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {(!isMobile || sidebarOpen) && (
        <aside style={{
          width: isMobile ? 260 : isTablet ? 220 : 255,
          background: "#0f172a", display: "flex", flexDirection: "column",
          flexShrink: 0, overflowY: "auto",
          height: isMobile ? "calc(100% - 52px)" : "100vh",
          position: isMobile ? "fixed" : "sticky",
          top: isMobile ? 52 : 0,
          left: 0,
          alignSelf: "flex-start",
          zIndex: isMobile ? 160 : "auto",
        }}>
          {!isMobile && (
            <div style={s.sbBrand}>
              <div style={s.sbLogo}>
                <div style={s.sbDot}>G</div>
                <span style={s.sbName}>GestAssoc</span>
              </div>
              {roleBadge && (
                <div style={{ marginTop: 10, display: "inline-block", background: roleBadge.bg, color: roleBadge.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, letterSpacing: ".04em" }}>
                  {roleBadge.label}
                </div>
              )}
            </div>
          )}

          {isMobile && roleBadge && (
            <div style={{ padding: "12px 16px 0" }}>
              <div style={{ display: "inline-block", background: roleBadge.bg, color: roleBadge.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                {roleBadge.label}
              </div>
            </div>
          )}

          <nav style={s.sbNav}>
            {menuSections.map((section) => (
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
                      onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                    >
                      {item.label}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>

          <div style={s.sbFooter}>
            <button style={s.sbLogoutBtn} onClick={handleLogout}>
              ⏻ Déconnexion
            </button>
          </div>
        </aside>
      )}

      <main style={{
        flex: 1,
        minHeight: "100vh",
        overflowX: "hidden",
        padding: isMobile ? "68px 12px 16px" : isTablet ? "20px 20px" : "24px 32px",
      }}>

        {!isMobile && (
          <div style={s.topBar}>
            <div>
              <div style={{ ...s.topTitle, fontSize: isTablet ? 20 : 26 }}>Tableau de bord</div>
              <div style={s.topSub}>
                {new Date().toLocaleDateString("fr-FR", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </div>
            </div>

            <div style={s.topRight}>
              <div style={s.notifBtn} onClick={() => navigate('/notifications')}>
                🔔
                <div style={s.notifDot} />
              </div>

              {isSuperAdmin && !isTablet && (
                <button style={s.addBtn} onClick={() => navigate("/associations/new")}>
                  + Nouvelle association
                </button>
              )}

              <div style={{ position: 'relative' }}>
                <div style={s.avatarBtn} onClick={() => setProfileOpen(!profileOpen)}>
                  <div style={s.avatarCircle}>{userInitials}</div>
                  {!isTablet && (
                    <div style={{ lineHeight: 1.3 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                        {user?.email?.split('@')[0] || 'Mon compte'}
                      </div>
                      {roleBadge && (
                        <div style={{ fontSize: 11, color: roleBadge.bg, fontWeight: 600 }}>
                          {roleBadge.label}
                        </div>
                      )}
                    </div>
                  )}
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>▼</span>
                </div>

                {profileOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setProfileOpen(false)} />
                    <div style={s.profileMenu}>
                      <div style={s.profileHeader}>
                        <div style={{ ...s.avatarCircle, width: 44, height: 44, fontSize: 16, flexShrink: 0 }}>{userInitials}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{user?.email?.split('@')[0]}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{user?.email}</div>
                          {roleBadge && (
                            <div style={{ display: 'inline-block', marginTop: 5, background: roleBadge.bg, color: roleBadge.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                              {roleBadge.label}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={s.profileDivider} />
                      <button style={s.profileItem} onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')} onClick={() => { setProfileOpen(false); navigate('/users/me'); }}>👤 Mon profil</button>
                      <button style={s.profileItem} onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')} onClick={() => { setProfileOpen(false); navigate('/forgot-password'); }}>🔐 Changer mot de passe</button>
                      <button style={s.profileItem} onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')} onClick={() => { setProfileOpen(false); navigate('/notifications'); }}>🔔 Mes notifications</button>
                      <div style={s.profileDivider} />
                      <button style={{ ...s.profileItem, color: '#dc2626' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')} onClick={handleLogout}>⏻ Déconnexion</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {isMobile && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Tableau de bord</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, textTransform: "capitalize" }}>
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={s.notifBtn} onClick={() => navigate('/notifications')}>
                🔔
                <div style={s.notifDot} />
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ ...s.avatarCircle, cursor: 'pointer' }} onClick={() => setProfileOpen(!profileOpen)}>{userInitials}</div>
                {profileOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setProfileOpen(false)} />
                    <div style={{ ...s.profileMenu, right: 0, left: 'auto' }}>
                      <div style={s.profileHeader}>
                        <div style={{ ...s.avatarCircle, width: 44, height: 44, fontSize: 16, flexShrink: 0 }}>{userInitials}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{user?.email?.split('@')[0]}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{user?.email}</div>
                          {roleBadge && <div style={{ display: 'inline-block', marginTop: 5, background: roleBadge.bg, color: roleBadge.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{roleBadge.label}</div>}
                        </div>
                      </div>
                      <div style={s.profileDivider} />
                      <button style={s.profileItem} onClick={() => { setProfileOpen(false); navigate('/users/me'); }}>👤 Mon profil</button>
                      <button style={s.profileItem} onClick={() => { setProfileOpen(false); navigate('/forgot-password'); }}>🔐 Changer mot de passe</button>
                      <button style={s.profileItem} onClick={() => { setProfileOpen(false); navigate('/notifications'); }}>🔔 Mes notifications</button>
                      <div style={s.profileDivider} />
                      <button style={{ ...s.profileItem, color: '#dc2626' }} onClick={handleLogout}>⏻ Déconnexion</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={s.loadWrap}>
            <p style={{ color: "#64748b", fontSize: 16 }}>Chargement des données…</p>
          </div>
        ) : (
          <>
            {/* ✅ Stats filtrées selon le rôle */}
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, minmax(0,1fr))",
              gap: isMobile ? 10 : 14,
              marginBottom: 18,
            }}>
              {visibleStats.map((stat) => (
                <div key={stat.label} style={s.sc}>
                  <div style={{ ...s.scAccent, background: stat.accent }} />
                  <div style={s.scTop}>
                    <div style={{ ...s.scIcon, background: stat.iconBg, width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}>{stat.icon}</div>
                    <div style={{ ...s.scTrend, background: stat.up ? "#dcfce7" : "#fee2e2", color: stat.up ? "#15803d" : "#dc2626" }}>
                      {stat.up ? "↑" : "↓"} {stat.trend}
                    </div>
                  </div>
                  <div style={{ ...s.scVal, fontSize: isMobile ? 24 : 32 }}>{stat.value.toLocaleString("fr-FR")}</div>
                  <div style={s.scLbl}>{stat.label}</div>
                  <div style={s.scSub}>{stat.sub}</div>
                </div>
              ))}
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.6fr 1fr",
              gap: 16, marginBottom: 16,
            }}>
              <div style={s.card}>
                <div style={s.cardHdr}>
                  <span style={s.cardTitle}>📈 Évolution des membres</span>
                  <button style={s.seeAll}>Ce mois →</button>
                </div>
                <div style={{ height: isMobile ? 160 : 200, position: "relative", marginTop: 8 }}>
                  <canvas ref={lineRef} />
                </div>
              </div>

              {/* ✅ Activité récente : masquée pour USER */}
              {!isMobile && isAdminOrSuperAdmin && (
                <div style={s.card}>
                  <div style={s.cardHdr}>
                    <span style={s.cardTitle}>🔔 Activité récente</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={s.notifItem}>
                      <div style={{ ...s.notifIc, background: "#eff6ff" }}>👤</div>
                      <div>
                        <div style={s.notifTxt}>Consultez les notifications pour l'activité récente</div>
                        <div style={s.notifTime}>
                          <button style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 12, padding: 0 }} onClick={() => navigate('/notifications')}>
                            Voir les notifications →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.4fr 1fr",
              gap: 16, marginBottom: 24,
            }}>
              {/* ✅ Rôles assignés : uniquement ADMIN et SUPER_ADMIN */}
              {isAdminOrSuperAdmin && (
                <div style={s.card}>
                  <div style={s.cardHdr}>
                    <span style={s.cardTitle}>🧾 Derniers rôles assignés</span>
                    <button style={s.seeAll} onClick={() => navigate("/user-association-roles")}>Voir tout →</button>
                  </div>
                  {recentRoles.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: 15, textAlign: "center", padding: "16px 0" }}>Aucune affectation.</p>
                  ) : (
                    <table style={s.table}>
                      <thead>
                        <tr>
                          <th style={s.th}>Utilisateur</th>
                          {!isMobile && <th style={s.th}>Association</th>}
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
                                  <div style={{ ...s.av, background: av.bg, color: av.color }}>{initials(r.userName)}</div>
                                  <div style={s.uname}>{r.userName ?? `Utilisateur ${r.id}`}</div>
                                </div>
                              </td>
                              {!isMobile && <td style={{ ...s.td, color: "#64748b" }}>{r.associationName ?? "—"}</td>}
                              <td style={s.td}>
                                <span style={{ ...s.bdg, background: av.bg, color: av.color }}>{r.roleName ?? "—"}</span>
                              </td>
                              <td style={s.td}>
                                <button style={s.det} onClick={() => navigate("/user-association-roles")}>Détail</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              <div style={s.card}>
                <div style={s.cardHdr}>
                  <span style={s.cardTitle}>🎯 Accès rapides</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 9 }}>
                  {quickActions.map((q) => (
                    <button
                      key={q.path}
                      style={s.qbtn}
                      onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "#eff6ff"; b.style.borderColor = "#bfdbfe"; b.style.color = "#1d4ed8"; }}
                      onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "#f8fafc"; b.style.borderColor = "#e2e8f0"; b.style.color = "#334155"; }}
                      onClick={() => navigate(q.path)}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                {!isMobile && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ ...s.cardTitle, marginBottom: 10 }}>📊 Répartition</div>
                    <div style={{ height: 170, position: "relative" }}>
                      <canvas ref={pieRef} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  sbBrand:        { padding: "22px 18px 18px", borderBottom: "1px solid #1e293b" },
  sbLogo:         { display: "flex", alignItems: "center", gap: 10 },
  sbDot:          { width: 36, height: 36, background: "#2563eb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 },
  sbName:         { fontSize: 17, fontWeight: 600, color: "#f1f5f9" },
  sbNav:          { padding: "14px 10px", flex: 1 },
  sbSection:      { fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: ".08em", padding: "14px 8px 6px", fontWeight: 600 },
  mi:             { display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 7, cursor: "pointer", color: "#94a3b8", fontSize: 14, marginBottom: 2 },
  miActive:       { background: "#1d4ed8", color: "#fff" },
  sbFooter:       { padding: "12px 10px", borderTop: "1px solid #1e293b" },
  sbLogoutBtn:    { width: "100%", background: "transparent", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 7, padding: "10px 12px", fontSize: 14, cursor: "pointer", textAlign: "left" as const },
  topBar:         { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  topTitle:       { fontSize: 26, fontWeight: 700, color: "#0f172a" },
  topSub:         { fontSize: 14, color: "#64748b", marginTop: 3, textTransform: "capitalize" },
  topRight:       { display: "flex", alignItems: "center", gap: 12 },
  notifBtn:       { position: "relative", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18 },
  notifDot:       { position: "absolute", top: 6, right: 6, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", border: "2px solid #fff" },
  addBtn:         { background: "#1d4ed8", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  loadWrap:       { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 },
  avatarBtn:      { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', cursor: 'pointer' },
  avatarCircle:   { width: 34, height: 34, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  profileMenu:    { position: 'absolute' as const, top: 'calc(100% + 8px)', right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: 240, zIndex: 99, overflow: 'hidden' },
  profileHeader:  { padding: '16px', display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc' },
  profileDivider: { height: '1px', background: '#f1f5f9' },
  profileItem:    { display: 'block', width: '100%', textAlign: 'left' as const, background: 'transparent', border: 'none', padding: '11px 16px', fontSize: 14, color: '#374151', cursor: 'pointer', fontWeight: 500 },
  sc:             { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px", position: "relative", overflow: "hidden" },
  scAccent:       { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },
  scTop:          { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  scIcon:         { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  scTrend:        { display: "flex", alignItems: "center", gap: 3, fontSize: 13, fontWeight: 600, padding: "3px 8px", borderRadius: 5 },
  scVal:          { fontSize: 32, fontWeight: 700, color: "#0f172a", lineHeight: 1 },
  scLbl:          { fontSize: 14, fontWeight: 600, color: "#475569", marginTop: 5 },
  scSub:          { fontSize: 13, color: "#94a3b8", marginTop: 3 },
  card:           { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 22px" },
  cardHdr:        { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardTitle:      { fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: ".04em" },
  seeAll:         { fontSize: 13, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 600 },
  table:          { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th:             { textAlign: "left", color: "#94a3b8", fontWeight: 600, padding: "0 0 10px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid #f1f5f9" },
  td:             { padding: "10px 0", borderBottom: "1px solid #f8fafc", color: "#334155", verticalAlign: "middle", fontSize: 14 },
  ucell:          { display: "flex", alignItems: "center", gap: 10 },
  av:             { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  uname:          { fontWeight: 600, color: "#0f172a", fontSize: 14 },
  bdg:            { padding: "4px 10px", borderRadius: 5, fontSize: 12, fontWeight: 600, letterSpacing: ".03em" },
  det:            { background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 12px", fontSize: 13, color: "#64748b", cursor: "pointer" },
  notifItem:      { display: "flex", alignItems: "flex-start", gap: 12, padding: 12, background: "#f8fafc", borderRadius: 9 },
  notifIc:        { width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
  notifTxt:       { fontSize: 14, color: "#334155", fontWeight: 500, lineHeight: 1.4 },
  notifTime:      { fontSize: 12, color: "#94a3b8", marginTop: 3 },
  qbtn:           { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 8px", fontSize: 13, color: "#334155", cursor: "pointer", textAlign: "center", fontWeight: 500 },
};