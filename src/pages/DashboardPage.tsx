import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAssociations } from "../api/associationService";
import { getUsers, getMyProfile } from "../api/userService";
import { getMembers } from "../api/memberService";
import { getCotisations } from "../api/cotisationService";
import { getUserAssociationRoles } from "../api/userAssociationRoleService";
import { getProjetsByFilters } from "../api/projetService";
import { useRole } from "../hooks/useRole";
import { useAuth } from "../context/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize";
import type { ProjetDto } from "../types/projet";
import type { UserAssociationRoleDto } from "../types/userAssociationRole";
import {
  Chart,
  LineElement,
  PointElement,
  LineController,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Filler,
} from "chart.js";

Chart.register(
  LineElement,
  PointElement,
  LineController,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Filler
);

const ALL_MENU_SECTIONS = [
  {
    title: "Principal",
    items: [
      { label: "🏠 Accueil", path: "/", roles: ["SUPER_ADMIN", "ADMIN", "USER"] },
      { label: "🏛️ Associations", path: "/associations", roles: ["SUPER_ADMIN", "ADMIN", "USER"] },
      { label: "👥 Membres", path: "/members", roles: ["SUPER_ADMIN", "ADMIN", "USER"] },
      { label: "🕐 Historique membres", path: "/member-histories", roles: ["SUPER_ADMIN", "ADMIN", "USER"] },
    ],
  },
  {
    title: "Finances",
    items: [
      { label: "💰 Cotisations", path: "/cotisations", roles: ["SUPER_ADMIN", "ADMIN", "USER"] },
      { label: "💳 Paiements", path: "/paiements", roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "⚙️ Configs cotisation", path: "/cotisation-configs", roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "📋 Suivi cotisations", path: "/cotisations/suivi", roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    title: "Actualités & Projet",
    items: [
      { label: "📁 Projets", path: "/projets", roles: ["SUPER_ADMIN", "ADMIN", "USER"] },
    ],
  },
  {
    title: "Gestion",
    items: [
      { label: "👤 Utilisateurs", path: "/users", roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "🏢 Bureau", path: "/bureaux", roles: ["SUPER_ADMIN", "ADMIN", "USER"] },
      { label: "🛡️ Rôles", path: "/roles", roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "🔗 User-Assoc-Roles", path: "/user-association-roles", roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "📧 Emails envoyés", path: "/emails-envoyes", roles: ["SUPER_ADMIN", "ADMIN", "USER"] },
      { label: "🔑 Code Email", path: "/email-codes", roles: ["SUPER_ADMIN", "ADMIN", "USER"] },
      { label: "🔔 Notifications", path: "/notifications", roles: ["SUPER_ADMIN", "ADMIN", "USER"] },
    ],
  },
  {
    title: "Autres",
    items: [
      { label: "📄 Documents", path: "/documents", roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "🔗 Liens de partage", path: "/liens-partage", roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "ℹ️ À propos", path: "/about", roles: ["SUPER_ADMIN", "ADMIN", "USER"] },
    ],
  },
];

const ALL_QUICK_ACTIONS = [
  { label: "🛡️ Assigner rôle", path: "/user-association-roles/new", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "👥 Ajouter membre", path: "/members/new", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "💰 Cotisation", path: "/cotisations/new", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "📁 Nouveau projet", path: "/projets/new", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "📧 Email", path: "/emails-envoyes/new", roles: ["SUPER_ADMIN", "ADMIN", "USER"] },
  { label: "👤 Utilisateur", path: "/users/new", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "📄 Document", path: "/documents/new", roles: ["SUPER_ADMIN", "ADMIN"] },
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
  ADMIN: { label: "Admin", bg: "#1d4ed8", color: "#fff" },
  USER: { label: "Utilisateur", bg: "#16a34a", color: "#fff" },
};

const STATUT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  EN_ATTENTE: { bg: "#fef3c7", color: "#b45309", label: "En attente" },
  EN_COURS: { bg: "#e6f4ea", color: "#137333", label: "En cours" },
  TERMINE: { bg: "#e8f0fe", color: "#1a73e8", label: "Terminé" },
  ANNULE: { bg: "#fee2e2", color: "#dc2626", label: "Annulé" },
};

const getDeviseSign = (code?: string) => {
  switch ((code ?? "").toUpperCase()) {
    case "USD":
    case "DOLLAR":
    case "$":
      return "$";
    case "CFA":
    case "XOF":
    case "XAF":
      return "FCFA";
    case "GNF":
    case "FG":
      return "GNF";
    default:
      return "€";
  }
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const lineRef = useRef<HTMLCanvasElement>(null);
  const pieRef = useRef<HTMLCanvasElement>(null);
  const lineChart = useRef<Chart | null>(null);
  const pieChart = useRef<Chart | null>(null);

  const { role, isSuperAdmin, isAdminOrSuperAdmin } = useRole();
  const { user } = useAuth();
  const { isMobile, isTablet } = useWindowSize();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [myAssociationId, setMyAssociationId] = useState<number | null | undefined>(undefined);

  const [recentRoles, setRecentRoles] = useState<UserAssociationRoleDto[]>([]);
  const [recentProjets, setRecentProjets] = useState<ProjetDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState([
    { label: "Associations", value: 0, sub: "enregistrées", accent: "#1d4ed8", iconBg: "#eff6ff", icon: "🏛️", trend: "+3", up: true },
    { label: "Utilisateurs", value: 0, sub: "inscrits", accent: "#16a34a", iconBg: "#f0fdf4", icon: "👤", trend: "+5", up: true },
    { label: "Membres", value: 0, sub: "au total", accent: "#d97706", iconBg: "#fffbeb", icon: "👥", trend: "+12", up: true },
    { label: "Cotisations", value: 0, sub: "enregistrées", accent: "#dc2626", iconBg: "#fef2f2", icon: "💰", trend: "-2", up: false },
    { label: "Rôles assignés", value: 0, sub: "affectations", accent: "#7c3aed", iconBg: "#f5f3ff", icon: "🛡️", trend: "+1", up: true },
    { label: "Projets", value: 0, sub: "actifs", accent: "#0891b2", iconBg: "#ecfeff", icon: "📁", trend: "+2", up: true },
  ]);

  const userInitials = user?.firstName && user?.lastName
  ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  : "ME";

const userDisplayName = user?.firstName && user?.lastName
  ? `${user.firstName} ${user.lastName}`
  : user?.email?.split("@")[0] || "Mon compte";

  const menuSections = ALL_MENU_SECTIONS.map((section) => {
    if (section.title === "Finances") {
      return {
        ...section,
        items: section.items
          .map((item) => {
            if (item.path === "/cotisations/suivi") {
              if (isSuperAdmin) return { ...item, path: "/cotisations/suivi/select" };
              if (myAssociationId) return { ...item, path: `/cotisations/suivi/${myAssociationId}` };
              return null;
            }

            return item;
          })
          .filter(
            (item): item is NonNullable<typeof item> =>
              item !== null && role !== null && role !== undefined && item.roles.includes(role)
          ),
      };
    }

    return {
      ...section,
      items: section.items.filter((item) => role && item.roles.includes(role)),
    };
  }).filter((section) => section.items.length > 0);

  const quickActions = ALL_QUICK_ACTIONS.filter((action) => role && action.roles.includes(role));
  const roleBadge = role ? ROLE_BADGES[role] : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  useEffect(() => {
    const loadProfileAssociation = async () => {
      if (isSuperAdmin) {
        setMyAssociationId(null);
        return;
      }

      try {
        const me = await getMyProfile();

        if (!me.id) {
          setMyAssociationId(null);
          return;
        }

        const rolesResponse = await getUserAssociationRoles({ userId: me.id }, 0, 1);
        const firstAssignment = rolesResponse.content?.[0];

        setMyAssociationId(firstAssignment?.associationId ?? null);
      } catch {
        setMyAssociationId(null);
      }
    };

    if (role) loadProfileAssociation();
  }, [role, isSuperAdmin]);

  useEffect(() => {
    if (myAssociationId === undefined) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);

        const assocFilter = myAssociationId ? { associationId: myAssociationId } : {};

        const promises: Promise<any>[] = [
          isSuperAdmin
            ? getAssociations({}, 0, 1)
            : isAdminOrSuperAdmin && myAssociationId
            ? getAssociations({}, 0, 1)
            : Promise.resolve({ totalElements: 0 }),

          isAdminOrSuperAdmin
            ? getUsers(assocFilter, 0, 1)
            : Promise.resolve({ totalElements: 0 }),

          getMembers({ page: 0, size: 1, ...assocFilter }),

          getCotisations(assocFilter, 0, 1),

          isAdminOrSuperAdmin
            ? getUserAssociationRoles(myAssociationId ? { associationId: myAssociationId } : {}, 0, 5)
            : Promise.resolve({ totalElements: 0, content: [] }),

          getProjetsByFilters(myAssociationId ? { associationId: myAssociationId } : {}, 0, 5),
        ];

        const [assocRes, usersRes, membersRes, cotisRes, rolesRes, projetsRes] =
          await Promise.allSettled(promises);

        const total = (result: PromiseSettledResult<any>) =>
          result.status === "fulfilled" ? result.value?.totalElements ?? 0 : 0;

        setStats((previousStats) =>
          previousStats.map((stat, index) => ({
            ...stat,
            value: [
              total(assocRes),
              total(usersRes),
              total(membersRes),
              total(cotisRes),
              total(rolesRes),
              total(projetsRes),
            ][index],
          }))
        );

        if (rolesRes.status === "fulfilled") {
          setRecentRoles(rolesRes.value?.content?.slice(0, 5) ?? []);
        }

        if (projetsRes.status === "fulfilled") {
          setRecentProjets(projetsRes.value?.content?.slice(0, 5) ?? []);
        }
      } catch (error) {
        console.error("Erreur dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [myAssociationId, isSuperAdmin, isAdminOrSuperAdmin]);

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
          labels: stats.map((stat) => stat.label),
          datasets: [
            {
              data: stats.map((stat) => stat.value),
              backgroundColor: stats.map((stat) => stat.accent),
              borderWidth: 0,
              hoverOffset: 4,
            },
          ],
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

  const visibleStats = stats.filter((_, index) => {
    if (isSuperAdmin) return true;
    if (isAdminOrSuperAdmin) return index !== 0;
    return index === 2 || index === 3 || index === 5;
  });

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        background: "#f1f5f9",
        position: "relative",
      }}
    >
      {isMobile && (
        <div style={s.mobileTopBar}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={s.mobileLogo}>G</div>
            <span style={s.mobileBrand}>GestAssoc</span>
          </div>

          <button style={s.mobileMenuButton} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "✕" : "☰"}
          </button>
        </div>
      )}

      {isMobile && sidebarOpen && <div style={s.mobileOverlay} onClick={() => setSidebarOpen(false)} />}

      {(!isMobile || sidebarOpen) && (
        <aside
          style={{
            width: isMobile ? 260 : isTablet ? 220 : 255,
            background: "#0f172a",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflowY: "auto",
            height: isMobile ? "calc(100% - 52px)" : "100vh",
            position: isMobile ? "fixed" : "sticky",
            top: isMobile ? 52 : 0,
            left: 0,
            alignSelf: "flex-start",
            zIndex: isMobile ? 160 : "auto",
          }}
        >
          {!isMobile && (
            <div style={s.sbBrand}>
              <div style={s.sbLogo}>
                <div style={s.sbDot}>G</div>
                <span style={s.sbName}>GestAssoc</span>
              </div>

              {roleBadge && <div style={{ ...s.sidebarRoleBadge, background: roleBadge.bg, color: roleBadge.color }}>{roleBadge.label}</div>}
            </div>
          )}

          {isMobile && roleBadge && (
            <div style={{ padding: "12px 16px 0" }}>
              <div style={{ ...s.sidebarRoleBadge, background: roleBadge.bg, color: roleBadge.color }}>{roleBadge.label}</div>
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
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
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

      <main
        style={{
          flex: 1,
          minHeight: "100vh",
          overflowX: "hidden",
          padding: isMobile ? "68px 12px 16px" : isTablet ? "20px 20px" : "24px 32px",
        }}
      >
        {!isMobile && (
          <div style={s.topBar}>
            <div>
              <div style={{ ...s.topTitle, fontSize: isTablet ? 20 : 26 }}>Tableau de bord</div>
              <div style={s.topSub}>
                {new Date().toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>

            <div style={s.topRight}>
              <div style={s.notifBtn} onClick={() => navigate("/notifications")}>
                🔔
                <div style={s.notifDot} />
              </div>

              {isSuperAdmin && !isTablet && (
                <button style={s.addBtn} onClick={() => navigate("/associations/new")}>
                  + Nouvelle association
                </button>
              )}

              <div style={{ position: "relative" }}>
                <div style={s.avatarBtn} onClick={() => setProfileOpen(!profileOpen)}>
                  <div style={s.avatarCircle}>{userInitials}</div>

                  {!isTablet && (
                    <div style={{ lineHeight: 1.3 }}>

                      <div style={s.accountName}>{userDisplayName}</div>
                      {roleBadge && <div style={{ ...s.accountRole, color: roleBadge.bg }}>{roleBadge.label}</div>}
                    </div>
                  )}

                  <span style={{ fontSize: 10, color: "#94a3b8" }}>▼</span>
                </div>

                {profileOpen && (
                  <>
                    <div style={s.profileBackdrop} onClick={() => setProfileOpen(false)} />
                    <ProfileMenu
                      userEmail={user?.email}
                      userInitials={userInitials}
                      roleBadge={roleBadge}
                      navigate={navigate}
                      handleLogout={handleLogout}
                      setProfileOpen={setProfileOpen}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {isMobile && (
          <MobileHeader
            userEmail={user?.email}
            userInitials={userInitials}
            roleBadge={roleBadge}
            profileOpen={profileOpen}
            setProfileOpen={setProfileOpen}
            navigate={navigate}
            handleLogout={handleLogout}
          />
        )}

        {loading ? (
          <div style={s.loadWrap}>
            <p style={{ color: "#64748b", fontSize: 16 }}>Chargement des données…</p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, minmax(0,1fr))",
                gap: isMobile ? 10 : 14,
                marginBottom: 18,
              }}
            >
              {visibleStats.map((stat) => (
                <div key={stat.label} style={s.sc}>
                  <div style={{ ...s.scAccent, background: stat.accent }} />
                  <div style={s.scTop}>
                    <div style={{ ...s.scIcon, background: stat.iconBg, width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}>
                      {stat.icon}
                    </div>
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.6fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div style={s.card}>
                <div style={s.cardHdr}>
                  <span style={s.cardTitle}>📈 Évolution des membres</span>
                  <button style={s.seeAll}>Ce mois →</button>
                </div>
                <div style={{ height: isMobile ? 160 : 200, position: "relative", marginTop: 8 }}>
                  <canvas ref={lineRef} />
                </div>
              </div>

              {!isMobile && isAdminOrSuperAdmin && (
                <div style={s.card}>
                  <div style={s.cardHdr}>
                    <span style={s.cardTitle}>🔔 Activité récente</span>
                  </div>

                  <div style={s.notifItem}>
                    <div style={{ ...s.notifIc, background: "#eff6ff" }}>👤</div>
                    <div>
                      <div style={s.notifTxt}>Consultez les notifications pour l'activité récente</div>
                      <div style={s.notifTime}>
                        <button style={s.linkButton} onClick={() => navigate("/notifications")}>
                          Voir les notifications →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.4fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              {isAdminOrSuperAdmin && (
                <div style={s.card}>
                  <div style={s.cardHdr}>
                    <span style={s.cardTitle}>🧾 Derniers rôles assignés</span>
                    <button style={s.seeAll} onClick={() => navigate("/user-association-roles")}>
                      Voir tout →
                    </button>
                  </div>

                  {recentRoles.length === 0 ? (
                    <p style={s.emptyText}>Aucune affectation.</p>
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
                        {recentRoles.map((assignment, index) => {
                          const avatar = AVATAR_COLORS[index % AVATAR_COLORS.length];

                          return (
                            <tr key={assignment.id ?? index}>
                              <td style={s.td}>
                                <div style={s.ucell}>
                                  <div style={{ ...s.av, background: avatar.bg, color: avatar.color }}>
                                    #{assignment.userId}
                                  </div>
                                  <div style={s.uname}>Utilisateur #{assignment.userId}</div>
                                </div>
                              </td>

                              {!isMobile && (
                                <td style={{ ...s.td, color: "#64748b" }}>
                                  {assignment.associationName ?? `Association #${assignment.associationId}`}
                                </td>
                              )}

                              <td style={s.td}>
                                <span style={{ ...s.bdg, background: avatar.bg, color: avatar.color }}>
                                  {assignment.roleName ?? `Rôle #${assignment.roleId}`}
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
              )}

              <div style={s.card}>
                <div style={s.cardHdr}>
                  <span style={s.cardTitle}>🎯 Accès rapides</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 9 }}>
                  {quickActions.map((quickAction) => (
                    <button key={quickAction.path} style={s.qbtn} onClick={() => navigate(quickAction.path)}>
                      {quickAction.label}
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

            <div style={{ marginBottom: 24 }}>
              <div style={s.card}>
                <div style={s.cardHdr}>
                  <span style={s.cardTitle}>📁 Derniers projets</span>
                  <button style={s.seeAll} onClick={() => navigate("/projets")}>
                    Voir tout →
                  </button>
                </div>

                {recentProjets.length === 0 ? (
                  <div style={s.noProjectBox}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                    Aucun projet enregistré.{" "}
                    {isAdminOrSuperAdmin && (
                      <button style={s.linkButton} onClick={() => navigate("/projets/new")}>
                        Créer le premier →
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3, 1fr)",
                      gap: 14,
                    }}
                  >
                    {recentProjets.map((project) => {
                      const status = STATUT_STYLE[project.statut] ?? STATUT_STYLE.EN_ATTENTE;
                      const sign = getDeviseSign(project.devise ?? "EUR");
                      const budget = project.budget ?? 0;
                      const depenses = (project.totalDepenses as unknown as number) ?? 0;
                      const pct = budget > 0 ? Math.min(Math.round((depenses / budget) * 100), 100) : 0;
                      const barColor = pct >= 90 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#22c55e";

                      return (
                        <div key={project.id} onClick={() => navigate(`/projets/${project.id}`)} style={s.projectCard}>
                          <div style={s.projectHeader}>
                            <span style={s.projectName}>{project.nom}</span>
                            <span style={{ ...s.projectStatus, background: status.bg, color: status.color }}>
                              {status.label}
                            </span>
                          </div>

                          {(project.chefDeProjetPrenom || project.chefDeProjetNom) && (
                            <div style={s.projectManager}>
                              👤 {project.chefDeProjetPrenom} {project.chefDeProjetNom}
                            </div>
                          )}

                          <div style={s.projectBudget}>
                            <div style={s.projectBudgetRow}>
                              <span>
                                Budget : <strong>{budget > 0 ? `${budget.toLocaleString("fr-FR")} ${sign}` : "—"}</strong>
                              </span>
                              <span style={{ color: "#dc2626", fontWeight: 600 }}>
                                {depenses > 0 ? `-${depenses.toLocaleString("fr-FR")} ${sign}` : `0 ${sign}`}
                              </span>
                            </div>

                            {budget > 0 && (
                              <div style={s.progressTrack}>
                                <div style={{ ...s.progressBar, width: `${pct}%`, background: barColor }} />
                              </div>
                            )}
                          </div>

                          {(project.dateDebut || project.dateFin) && (
                            <div style={s.projectDates}>
                              {project.dateDebut && (
                                <span>
                                  📅{" "}
                                  {new Date(project.dateDebut).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              )}

                              {project.dateFin && (
                                <span>
                                  →{" "}
                                  {new Date(project.dateFin).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isAdminOrSuperAdmin && recentProjets.length > 0 && (
                  <div style={{ marginTop: 16, textAlign: "right" }}>
                    <button onClick={() => navigate("/projets/new")} style={s.newProjectButton}>
                      + Nouveau projet
                    </button>
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

function ProfileMenu({
  userEmail,
  userInitials,
  roleBadge,
  navigate,
  handleLogout,
  setProfileOpen,
}: {
  userEmail?: string;
  userInitials: string;
  roleBadge: { label: string; bg: string; color: string } | null;
  navigate: ReturnType<typeof useNavigate>;
  handleLogout: () => void;
  setProfileOpen: (open: boolean) => void;
}) {
  return (
    <div style={s.profileMenu}>
      <div style={s.profileHeader}>
        <div style={{ ...s.avatarCircle, width: 44, height: 44, fontSize: 16, flexShrink: 0 }}>{userInitials}</div>
        <div>
          <div style={s.profileName}>{userEmail?.split("@")[0]}</div>
          <div style={s.profileEmail}>{userEmail}</div>
          {roleBadge && <div style={{ ...s.profileRoleBadge, background: roleBadge.bg, color: roleBadge.color }}>{roleBadge.label}</div>}
        </div>
      </div>

      <div style={s.profileDivider} />

      <button style={s.profileItem} onClick={() => { setProfileOpen(false); navigate("/users/me"); }}>👤 Mon profil</button>
      <button style={s.profileItem} onClick={() => { setProfileOpen(false); navigate("/forgot-password"); }}>🔐 Changer mot de passe</button>
      <button style={s.profileItem} onClick={() => { setProfileOpen(false); navigate("/notifications"); }}>🔔 Mes notifications</button>

      <div style={s.profileDivider} />

      <button style={{ ...s.profileItem, color: "#dc2626" }} onClick={handleLogout}>⏻ Déconnexion</button>
    </div>
  );
}

function MobileHeader({
  userEmail,
  userInitials,
  roleBadge,
  profileOpen,
  setProfileOpen,
  navigate,
  handleLogout,
}: {
  userEmail?: string;
  userInitials: string;
  roleBadge: { label: string; bg: string; color: string } | null;
  profileOpen: boolean;
  setProfileOpen: (open: boolean) => void;
  navigate: ReturnType<typeof useNavigate>;
  handleLogout: () => void;
}) {
  return (
    <div style={s.mobileDashboardHeader}>
      <div>
        <div style={s.mobileDashboardTitle}>Tableau de bord</div>
        <div style={s.mobileDashboardDate}>
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={s.notifBtn} onClick={() => navigate("/notifications")}>
          🔔
          <div style={s.notifDot} />
        </div>

        <div style={{ position: "relative" }}>
          <div style={{ ...s.avatarCircle, cursor: "pointer" }} onClick={() => setProfileOpen(!profileOpen)}>
            {userInitials}
          </div>

          {profileOpen && (
            <>
              <div style={s.profileBackdrop} onClick={() => setProfileOpen(false)} />
              <div style={{ ...s.profileMenu, right: 0, left: "auto" }}>
                <div style={s.profileHeader}>
                  <div style={{ ...s.avatarCircle, width: 44, height: 44, fontSize: 16, flexShrink: 0 }}>{userInitials}</div>
                  <div>
                    <div style={s.profileName}>{userEmail?.split("@")[0]}</div>
                    <div style={s.profileEmail}>{userEmail}</div>
                    {roleBadge && <div style={{ ...s.profileRoleBadge, background: roleBadge.bg, color: roleBadge.color }}>{roleBadge.label}</div>}
                  </div>
                </div>

                <div style={s.profileDivider} />

                <button style={s.profileItem} onClick={() => { setProfileOpen(false); navigate("/users/me"); }}>👤 Mon profil</button>
                <button style={s.profileItem} onClick={() => { setProfileOpen(false); navigate("/forgot-password"); }}>🔐 Changer mot de passe</button>
                <button style={s.profileItem} onClick={() => { setProfileOpen(false); navigate("/notifications"); }}>🔔 Mes notifications</button>

                <div style={s.profileDivider} />

                <button style={{ ...s.profileItem, color: "#dc2626" }} onClick={handleLogout}>⏻ Déconnexion</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  mobileTopBar: { position: "fixed", top: 0, left: 0, right: 0, height: 52, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 200 },
  mobileLogo: { width: 30, height: 30, background: "#2563eb", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" },
  mobileBrand: { color: "#f1f5f9", fontWeight: 700, fontSize: 15 },
  mobileMenuButton: { background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", padding: 4 },
  mobileOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 150 },
  sbBrand: { padding: "22px 18px 18px", borderBottom: "1px solid #1e293b" },
  sbLogo: { display: "flex", alignItems: "center", gap: 10 },
  sbDot: { width: 36, height: 36, background: "#2563eb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 },
  sbName: { fontSize: 17, fontWeight: 600, color: "#f1f5f9" },
  sidebarRoleBadge: { marginTop: 10, display: "inline-block", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, letterSpacing: ".04em" },
  sbNav: { padding: "14px 10px", flex: 1 },
  sbSection: { fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: ".08em", padding: "14px 8px 6px", fontWeight: 600 },
  mi: { display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 7, cursor: "pointer", color: "#94a3b8", fontSize: 14, marginBottom: 2 },
  miActive: { background: "#1d4ed8", color: "#fff" },
  sbFooter: { padding: "12px 10px", borderTop: "1px solid #1e293b" },
  sbLogoutBtn: { width: "100%", background: "transparent", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 7, padding: "10px 12px", fontSize: 14, cursor: "pointer", textAlign: "left" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  topTitle: { fontSize: 26, fontWeight: 700, color: "#0f172a" },
  topSub: { fontSize: 14, color: "#64748b", marginTop: 3, textTransform: "capitalize" },
  topRight: { display: "flex", alignItems: "center", gap: 12 },
  notifBtn: { position: "relative", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18 },
  notifDot: { position: "absolute", top: 6, right: 6, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", border: "2px solid #fff" },
  addBtn: { background: "#1d4ed8", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  avatarBtn: { display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", cursor: "pointer" },
  avatarCircle: { width: 34, height: 34, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 },
  accountName: { fontSize: 13, fontWeight: 600, color: "#0f172a" },
  accountRole: { fontSize: 11, fontWeight: 600 },
  profileBackdrop: { position: "fixed", inset: 0, zIndex: 98 },
  profileMenu: { position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", minWidth: 240, zIndex: 99, overflow: "hidden" },
  profileHeader: { padding: 16, display: "flex", alignItems: "center", gap: 12, background: "#f8fafc" },
  profileName: { fontWeight: 600, fontSize: 14, color: "#0f172a" },
  profileEmail: { fontSize: 12, color: "#64748b", marginTop: 2 },
  profileRoleBadge: { display: "inline-block", marginTop: 5, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 },
  profileDivider: { height: 1, background: "#f1f5f9" },
  profileItem: { display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "11px 16px", fontSize: 14, color: "#374151", cursor: "pointer", fontWeight: 500 },
  mobileDashboardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  mobileDashboardTitle: { fontSize: 18, fontWeight: 700, color: "#0f172a" },
  mobileDashboardDate: { fontSize: 12, color: "#64748b", marginTop: 2, textTransform: "capitalize" },
  loadWrap: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 },
  sc: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px", position: "relative", overflow: "hidden" },
  scAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },
  scTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  scIcon: { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  scTrend: { display: "flex", alignItems: "center", gap: 3, fontSize: 13, fontWeight: 600, padding: "3px 8px", borderRadius: 5 },
  scVal: { fontSize: 32, fontWeight: 700, color: "#0f172a", lineHeight: 1 },
  scLbl: { fontSize: 14, fontWeight: 600, color: "#475569", marginTop: 5 },
  scSub: { fontSize: 13, color: "#94a3b8", marginTop: 3 },
  card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 22px" },
  cardHdr: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: ".04em" },
  seeAll: { fontSize: 13, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 600 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", color: "#94a3b8", fontWeight: 600, padding: "0 0 10px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid #f1f5f9" },
  td: { padding: "10px 0", borderBottom: "1px solid #f8fafc", color: "#334155", verticalAlign: "middle", fontSize: 14 },
  ucell: { display: "flex", alignItems: "center", gap: 10 },
  av: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  uname: { fontWeight: 600, color: "#0f172a", fontSize: 14 },
  bdg: { padding: "4px 10px", borderRadius: 5, fontSize: 12, fontWeight: 600, letterSpacing: ".03em" },
  det: { background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 12px", fontSize: 13, color: "#64748b", cursor: "pointer" },
  emptyText: { color: "#94a3b8", fontSize: 15, textAlign: "center", padding: "16px 0" },
  notifItem: { display: "flex", alignItems: "flex-start", gap: 12, padding: 12, background: "#f8fafc", borderRadius: 9 },
  notifIc: { width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
  notifTxt: { fontSize: 14, color: "#334155", fontWeight: 500, lineHeight: 1.4 },
  notifTime: { fontSize: 12, color: "#94a3b8", marginTop: 3 },
  linkButton: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, padding: 0, fontWeight: 600 },
  qbtn: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 8px", fontSize: 13, color: "#334155", cursor: "pointer", textAlign: "center", fontWeight: 500 },
  noProjectBox: { textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 14 },
  projectCard: { border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, cursor: "pointer", background: "#fafafa", display: "flex", flexDirection: "column", gap: 10 },
  projectHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  projectName: { fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.3 },
  projectStatus: { flexShrink: 0, padding: "3px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700 },
  projectManager: { fontSize: 12, color: "#64748b" },
  projectBudget: { fontSize: 12, color: "#475569" },
  projectBudgetRow: { display: "flex", justifyContent: "space-between", marginBottom: 5 },
  progressTrack: { height: 5, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: 99, transition: "width 0.4s ease" },
  projectDates: { fontSize: 11, color: "#94a3b8", display: "flex", gap: 10 },
  newProjectButton: { padding: "8px 16px", background: "#0891b2", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600 },
};