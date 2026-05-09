import { useNavigate } from "react-router-dom";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: "#f8fafc" }}>

      {/* NAVBAR */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: 64, background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "#1d4ed8", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15 }}>G</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>GestAssoc</span>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          <span onClick={() => navigate("/")} style={{ fontSize: 14, color: "#64748b", cursor: "pointer" }}>Accueil</span>
          <span style={{ fontSize: 14, color: "#1d4ed8", fontWeight: 600, borderBottom: "2px solid #1d4ed8", paddingBottom: 2, cursor: "pointer" }}>Qui sommes-nous</span>
          <span onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: 14, color: "#64748b", cursor: "pointer" }}>Contact</span>
        </div>
        <button onClick={() => navigate("/login")} style={{ background: "#1d4ed8", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Se connecter
        </button>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>

        {/* HERO */}
        <section style={{ display: "flex", alignItems: "flex-start", gap: 32, marginBottom: 48 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>À propos</p>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", margin: "0 0 16px", lineHeight: 1.3 }}>Qui sommes-nous ?</h1>
            <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8, margin: "0 0 14px" }}>
              GestAssoc est une plateforme de gestion associative développée pour simplifier l'administration des associations. Notre mission est de fournir des outils modernes, accessibles et efficaces pour gérer membres, cotisations et communications.
            </p>
            <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8, margin: 0 }}>
              Fondée en 2024, notre équipe est composée de développeurs et de professionnels engagés dans la transformation numérique du secteur associatif.
            </p>
          </div>
          <div style={{ width: 220, background: "#fff", borderRadius: 12, padding: 24, border: "1px solid #e2e8f0", flexShrink: 0 }}>
            {[
              { value: "+50",  label: "associations gérées" },
              { value: "+500", label: "membres enregistrés" },
              { value: "99%",  label: "satisfaction client" },
            ].map(({ value, label }) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#1d4ed8" }}>{value}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* VALEURS */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 48 }}>
          {[
            { icon: "🔐", title: "Sécurité",          desc: "Authentification sécurisée et gestion des accès par rôles pour chaque utilisateur." },
            { icon: "🏛️", title: "Multi-associations", desc: "Gérez plusieurs associations depuis un seul tableau de bord." },
            { icon: "📱", title: "Responsive",         desc: "Interface optimisée sur mobile, tablette et desktop." },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#0f172a", marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </section>

        {/* CONTACT */}
        <section id="contact" style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 24px" }}>Contactez-nous</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>

            {/* COORDONNÉES */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { icon: "✉️", label: "Email",     value: "alassanediallozig@gmail.com", color: "#1d4ed8" },
                { icon: "📞", label: "Téléphone", value: "+33 6 10 40 66 85",           color: "#0f172a" },
                { icon: "📍", label: "Adresse",   value: "Paris, France",               color: "#0f172a" },
              ].map(({ icon, label, value, color }, i, arr) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <div style={{ width: 40, height: 40, background: "#eff6ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* FORMULAIRE */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="text"  placeholder="Votre nom"      style={inputStyle} />
              <input type="email" placeholder="Votre email"    style={inputStyle} />
              <textarea           placeholder="Votre message..." style={{ ...inputStyle, height: 100, resize: "none" as const }} />
              <button style={{ background: "#1d4ed8", color: "#fff", border: "none", padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Envoyer le message
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer style={{ textAlign: "center", padding: "24px", borderTop: "1px solid #e2e8f0", marginTop: 32 }}>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>© 2026 GestAssoc — Tous droits réservés</p>
      </footer>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 14,
  color: "#0f172a",
  background: "#f8fafc",
  boxSizing: "border-box",
  outline: "none",
};