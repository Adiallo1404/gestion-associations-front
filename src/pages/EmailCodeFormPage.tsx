import type { FormEvent, KeyboardEvent, CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { emailCodeService } from "../api/emailCodeService";

const CODE_LENGTH = 6;
const EXPIRATION_SECONDS = 15 * 60;

export default function EmailCodeFormPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [message, setMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(EXPIRATION_SECONDS);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const finalCode = useMemo(() => code.join(""), [code]);

  useEffect(() => {
    if (!isCodeSent || timeLeft <= 0) return;

    const intervalId = window.setInterval(() => {
      setTimeLeft((currentValue) => Math.max(currentValue - 1, 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isCodeSent, timeLeft]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const isValidEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || fallback;
    }

    return fallback;
  };

  const handleCodeChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;

    const nextCode = [...code];
    nextCode[index] = value;
    setCode(nextCode);

    if (value && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const resetCodeInputs = () => {
    setCode(Array(CODE_LENGTH).fill(""));
    window.setTimeout(() => inputsRef.current[0]?.focus(), 0);
  };

  const handleGenerate = async () => {
    const trimmedEmail = email.trim();

    if (!isValidEmail(trimmedEmail)) {
      setMessage("❌ Veuillez saisir une adresse email valide.");
      return;
    }

    try {
      setIsGenerating(true);
      setMessage(null);

      await emailCodeService.generateCode({ email: trimmedEmail });

      setIsCodeSent(true);
      setTimeLeft(EXPIRATION_SECONDS);
      resetCodeInputs();
      setMessage("📩 Code envoyé. Vérifiez votre boîte email.");
    } catch (error) {
      setMessage(
        getErrorMessage(error, "❌ Erreur lors de l'envoi du code.")
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!isValidEmail(trimmedEmail)) {
      setMessage("❌ Veuillez saisir une adresse email valide.");
      return;
    }

    if (finalCode.length !== CODE_LENGTH) {
      setMessage("❌ Code incomplet.");
      return;
    }

    if (timeLeft <= 0) {
      setMessage("❌ Le code a expiré. Veuillez demander un nouveau code.");
      return;
    }

    try {
      setIsVerifying(true);
      setMessage(null);

      await emailCodeService.verifyCode({
        email: trimmedEmail,
        code: finalCode,
      });

      setMessage("✅ Code validé avec succès.");
    } catch (error) {
      setMessage(
        getErrorMessage(error, "❌ Code invalide ou expiré.")
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    await handleGenerate();
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <nav style={breadcrumbStyle}>
          <span style={breadcrumbHomeStyle} onClick={() => navigate("/")}>
            <span style={{ fontSize: 16 }}>🏠</span> Accueil
          </span>

          <span style={breadcrumbSeparatorStyle}>›</span>

          <span style={breadcrumbCurrentStyle}>🔑 Code Email</span>
        </nav>

        <h2 style={titleStyle}>🔐 Vérifier le code email</h2>

        {message && <p style={messageStyle}>{message}</p>}

        <input
          type="email"
          placeholder="Votre email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={inputStyle}
          disabled={isGenerating || isVerifying}
        />

        <button
          type="button"
          onClick={handleGenerate}
          style={primaryButtonStyle}
          disabled={isGenerating || isVerifying}
        >
          {isGenerating ? "Envoi..." : "📩 Envoyer le code"}
        </button>

        <form onSubmit={handleVerify}>
          <div style={codeContainerStyle}>
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(event) =>
                  handleCodeChange(event.target.value, index)
                }
                onKeyDown={(event) => handleCodeKeyDown(event, index)}
                ref={(element) => {
                  inputsRef.current[index] = element;
                }}
                style={codeInputStyle}
                disabled={!isCodeSent || isVerifying}
              />
            ))}
          </div>

          <p style={timerStyle}>
            ⏳ Expire dans : {formatTime(timeLeft)}
          </p>

          <button
            type="submit"
            style={successButtonStyle}
            disabled={!isCodeSent || isVerifying || timeLeft <= 0}
          >
            {isVerifying ? "Vérification..." : "✅ Vérifier"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          style={resendButtonStyle}
          disabled={isGenerating || isVerifying || !email.trim()}
        >
          🔁 Renvoyer le code
        </button>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  background: "#F5F5F3",
};

const cardStyle: CSSProperties = {
  background: "#fff",
  padding: 30,
  borderRadius: 12,
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  width: 380,
};

const breadcrumbStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 20,
  fontSize: 14,
};

const breadcrumbHomeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#64748b",
  cursor: "pointer",
  fontWeight: 500,
  background: "#f1f5f9",
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #e2e8f0",
};

const breadcrumbSeparatorStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: 16,
};

const breadcrumbCurrentStyle: CSSProperties = {
  color: "#0f172a",
  fontWeight: 600,
};

const titleStyle: CSSProperties = {
  textAlign: "center",
  marginBottom: 20,
  fontSize: 24,
};

const messageStyle: CSSProperties = {
  textAlign: "center",
  marginBottom: 10,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  marginBottom: 10,
  boxSizing: "border-box",
};

const codeContainerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10,
};

const codeInputStyle: CSSProperties = {
  width: 45,
  height: 50,
  textAlign: "center",
  fontSize: 20,
  borderRadius: 8,
  border: "1px solid #ccc",
};

const timerStyle: CSSProperties = {
  textAlign: "center",
  marginBottom: 10,
  fontSize: 14,
  color: "#555",
};

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: 10,
  background: "#185FA5",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  marginBottom: 10,
};

const successButtonStyle: CSSProperties = {
  width: "100%",
  padding: 10,
  background: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const resendButtonStyle: CSSProperties = {
  marginTop: 10,
  width: "100%",
  padding: 10,
  background: "#f39c12",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};