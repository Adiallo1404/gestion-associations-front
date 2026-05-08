import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateCode, verifyCode } from "../api/emailCodeService";

export default function EmailCodeFormPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(Array(6).fill(""));
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const finalCode = code.join("");

  const handleGenerate = async () => {
    if (!email) { setMessage("❌ Email requis"); return; }
    try {
      await generateCode(email);
      setMessage("📩 Code envoyé !");
      setTimeLeft(15 * 60);
      inputsRef.current[0]?.focus();
    } catch {
      setMessage("❌ Erreur envoi code");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalCode.length !== 6) { setMessage("❌ Code incomplet"); return; }
    try {
      await verifyCode(email, finalCode);
      setMessage("✅ Code validé !");
    } catch {
      setMessage("❌ Code invalide ou expiré");
    }
  };

  const handleResend = async () => {
    try {
      await generateCode(email);
      setMessage("📩 Nouveau code envoyé !");
      setTimeLeft(15 * 60);
      setCode(Array(6).fill(""));
      inputsRef.current[0]?.focus();
    } catch {
      setMessage("❌ Erreur renvoi");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* ✅ Bouton retour tableau de bord */}
        <button style={styles.btnBack} onClick={() => navigate("/")}>
          ← Tableau de bord
        </button>

        <h2 style={styles.title}>🔐 Vérifier le code</h2>

        {message && <p style={styles.message}>{message}</p>}

        <input
          type="email"
          placeholder="Votre email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleGenerate} style={styles.btnPrimary}>
          📩 Envoyer le code
        </button>

        <form onSubmit={handleVerify}>
          <div style={styles.codeContainer}>
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                ref={(el) => { inputsRef.current[index] = el; }}
                style={styles.codeInput}
              />
            ))}
          </div>

          <p style={styles.timer}>
            ⏳ Expire dans : {formatTime(timeLeft)}
          </p>

          <button type="submit" style={styles.btnSuccess}>
            ✅ Vérifier
          </button>
        </form>

        <button onClick={handleResend} style={styles.btnResend}>
          🔁 Renvoyer le code
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "90vh",
    background: "#F5F5F3",
  },
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    width: "380px",
  },
  // ✅ Nouveau style bouton retour
  btnBack: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    background: "none",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: 14,
    padding: 0,
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    fontSize: "24px",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginBottom: "10px",
    boxSizing: "border-box",
  },
  codeContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  codeInput: {
    width: "45px",
    height: "50px",
    textAlign: "center",
    fontSize: "20px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  timer: {
    textAlign: "center",
    marginBottom: "10px",
    fontSize: "14px",
    color: "#555",
  },
  btnPrimary: {
    width: "100%",
    padding: "10px",
    background: "#185FA5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "10px",
  },
  btnSuccess: {
    width: "100%",
    padding: "10px",
    background: "#27ae60",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  btnResend: {
    marginTop: "10px",
    width: "100%",
    padding: "10px",
    background: "#f39c12",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  message: {
    textAlign: "center",
    marginBottom: "10px",
  },
};