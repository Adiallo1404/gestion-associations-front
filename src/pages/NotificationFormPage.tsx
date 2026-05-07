import { useEffect, useState } from "react";
import { notificationService } from "../api/notificationService";
import { getAssociations } from "../api/associationService";
import { memberService } from "../api/memberService";
import { getUsers } from "../api/userService";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const TYPE_OPTIONS = [
  { value: "RELANCE_COTISATION", label: "Relance cotisation" },
  { value: "COTISATION_PAYEE", label: "Cotisation payée" },
  { value: "NOUVEAU_MEMBRE", label: "Nouveau membre" },
  { value: "CHANGEMENT_STATUT", label: "Changement statut" },
  { value: "DOCUMENT_PARTAGE", label: "Document partagé" },
  { value: "RAPPEL_ECHEANCE", label: "Rappel échéance" },
  { value: "INFORMATION_GENERALE", label: "Information générale" },
];

export default function NotificationFormPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    titre: "",
    message: "",
    typeNotification: "INFORMATION_GENERALE",
    associationId: "",
    destinataireId: "",
    memberId: "",
    lienAction: "",
    dateExpiration: "",
    envoyeeParEmail: false,
  });

  const [associations, setAssociations] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAssociations(0, 1000)
      .then((res) => setAssociations(res.content || []))
      .catch(() => toast.error("Impossible de charger les associations"));
  }, []);

  useEffect(() => {
    getUsers({}, 0, 1000)
      .then((res) => setUsers(res.content || []))
      .catch(() => toast.error("Impossible de charger les utilisateurs"));
  }, []);

  useEffect(() => {
    if (!form.associationId) {
      setMembers([]);
      return;
    }

    memberService
      .getAll({ associationId: Number(form.associationId), size: 1000 })
      .then((res) => setMembers(res.content || []));
  }, [form.associationId]);

  const handleSubmit = async () => {
    if (!form.titre.trim()) return toast.error("Titre obligatoire");
    if (!form.message.trim()) return toast.error("Message obligatoire");
    if (!form.associationId) return toast.error("Association obligatoire");
    if (!form.destinataireId) return toast.error("Destinataire obligatoire");

    const payload = {
      titre: form.titre,
      message: form.message,
      typeNotification: form.typeNotification,
      statut: "NON_LUE",
      associationId: Number(form.associationId),
      destinataireId: Number(form.destinataireId),
      memberId: form.memberId ? Number(form.memberId) : null,
      lienAction: form.lienAction || null,
      dateExpiration: form.dateExpiration || null,
      envoyeeParEmail: form.envoyeeParEmail,
    };

    setSubmitting(true);

    try {
      await notificationService.create(payload);
      toast.success("Notification créée avec succès 🎉");
      navigate("/notifications");
    } catch (err: any) {
      toast.error(err?.message || "Erreur serveur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>🔔 Créer une notification</h2>

        {/* TITRE */}
        <label style={styles.label}>Titre *</label>
        <input
          style={styles.input}
          value={form.titre}
          onChange={(e) => setForm({ ...form, titre: e.target.value })}
          placeholder="Titre de la notification"
        />

        {/* TYPE */}
        <label style={styles.label}>Type *</label>
        <select
          style={styles.input}
          value={form.typeNotification}
          onChange={(e) =>
            setForm({ ...form, typeNotification: e.target.value })
          }
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* ASSOCIATION */}
        <label style={styles.label}>Association *</label>
        <select
          style={styles.input}
          value={form.associationId}
          onChange={(e) =>
            setForm({
              ...form,
              associationId: e.target.value,
              memberId: "",
            })
          }
        >
          <option value="">-- Choisir --</option>
          {associations.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {/* DESTINATAIRE */}
        <label style={styles.label}>Destinataire *</label>
        <select
          style={styles.input}
          value={form.destinataireId}
          onChange={(e) =>
            setForm({ ...form, destinataireId: e.target.value })
          }
        >
          <option value="">-- Choisir --</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName}
            </option>
          ))}
        </select>

        {/* MEMBRE */}
        <label style={styles.label}>Membre (optionnel)</label>
        <select
          style={styles.input}
          disabled={!form.associationId}
          value={form.memberId}
          onChange={(e) =>
            setForm({ ...form, memberId: e.target.value })
          }
        >
          <option value="">-- Aucun --</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </select>

        {/* MESSAGE */}
        <label style={styles.label}>Message *</label>
        <textarea
          style={{ ...styles.input, height: 100 }}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Message de la notification..."
        />

        {/* LIEN */}
        <label style={styles.label}>Lien action</label>
        <input
          style={styles.input}
          value={form.lienAction}
          onChange={(e) =>
            setForm({ ...form, lienAction: e.target.value })
          }
          placeholder="https://..."
        />

        {/* DATE */}
        <label style={styles.label}>Date expiration</label>
        <input
          type="datetime-local"
          style={styles.input}
          value={form.dateExpiration}
          onChange={(e) =>
            setForm({ ...form, dateExpiration: e.target.value })
          }
        />

        {/* EMAIL */}
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={form.envoyeeParEmail}
            onChange={(e) =>
              setForm({ ...form, envoyeeParEmail: e.target.checked })
            }
          />
          Envoyer par email
        </label>

        {/* BUTTONS */}
        <div style={styles.actions}>
          <button
            style={styles.cancel}
            onClick={() => navigate("/notifications")}
          >
            Annuler
          </button>

          <button
            style={styles.submit}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Enregistrement..." : "Créer notification"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLE ================= */
const styles: Record<string, any> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#eef2ff,#f8fafc)",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    padding: 28,
    borderRadius: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    color: "#1e1b4b",
    fontSize: 20,
    fontWeight: 700,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    marginTop: 10,
    marginBottom: 5,
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: 14,
  },
  checkbox: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#334155",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  cancel: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    background: "#fff",
    cursor: "pointer",
  },
  submit: {
    flex: 2,
    padding: 10,
    borderRadius: 8,
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
};