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
  const [members, setMembers]           = useState<any[]>([]);
  const [users, setUsers]               = useState<any[]>([]);
  const [submitting, setSubmitting]     = useState(false);

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
    if (form.associationId) {
      memberService
        .getAll({ associationId: form.associationId, size: 1000 })
        .then((res) => setMembers(res.content || []));
    } else {
      setMembers([]);
    }
  }, [form.associationId]);

  // ✅ FIX navigate : utilise window.location.href en fallback
  const goToList = () => {
    try {
      navigate("/notifications");
    } catch {
      window.location.href = "/notifications";
    }
  };

  const handleSubmit = async () => {
    if (!form.titre.trim())   { toast.error("⚠️ Titre obligatoire"); return; }
    if (!form.message.trim()) { toast.error("⚠️ Message obligatoire"); return; }
    if (!form.associationId)  { toast.error("⚠️ Choisir une association"); return; }
    if (!form.destinataireId) { toast.error("⚠️ Choisir un destinataire"); return; }

    const payload = {
      titre:            form.titre.trim(),
      message:          form.message.trim(),
      typeNotification: form.typeNotification,
      statut:           "NON_LUE",
      associationId:    Number(form.associationId),
      destinataireId:   Number(form.destinataireId),
      memberId:         form.memberId ? Number(form.memberId) : null,
      dateExpiration:   form.dateExpiration || null,
      lienAction:       form.lienAction.trim() || null,
      envoyeeParEmail:  form.envoyeeParEmail,
    };

    console.log("📤 Payload envoyé :", payload);
    setSubmitting(true);
    try {
      await notificationService.create(payload);
      toast.success("✅ Notification créée !");
      // ✅ FIX : window.location.href au lieu de navigate
      window.location.href = "/notifications";
    } catch (err: any) {
      console.error("❌ Erreur:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Erreur inconnue";
      toast.error(`❌ Erreur : ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      marginTop: 35,
      background: "#f4f6f9",
      minHeight: "100vh",
    }}>
      <div style={{
        background: "white",
        padding: 30,
        borderRadius: 10,
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        width: 420,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignSelf: "flex-start",
      }}>
        <h2 style={{ textAlign: "center", color: "#4c1d95", marginBottom: 10 }}>
          🔔 Créer une notification
        </h2>

        <label style={labelStyle}>Titre *</label>
        <input
          style={input}
          placeholder="Ex: Rappel cotisation"
          value={form.titre}
          onChange={(e) => setForm({ ...form, titre: e.target.value })}
        />

        <label style={labelStyle}>Type *</label>
        <select style={input} value={form.typeNotification}
          onChange={(e) => setForm({ ...form, typeNotification: e.target.value })}>
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <label style={labelStyle}>Association *</label>
        <select style={input} value={form.associationId}
          onChange={(e) => setForm({ ...form, associationId: e.target.value, memberId: "" })}>
          <option value="">-- Choisir une association --</option>
          {associations.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <label style={labelStyle}>Destinataire (User) *</label>
        <select style={input} value={form.destinataireId}
          onChange={(e) => setForm({ ...form, destinataireId: e.target.value })}>
          <option value="">-- Choisir un destinataire --</option>
          {users.map((u) => (
            <option key={u.roleid ?? u.id} value={u.roleid ?? u.id}>
              {u.firstName} {u.lastName} — {u.email}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Membre concerné (optionnel)</label>
        <select
          style={{ ...input, background: !form.associationId ? "#f5f5f5" : "white" }}
          value={form.memberId}
          disabled={!form.associationId}
          onChange={(e) => setForm({ ...form, memberId: e.target.value })}>
          <option value="">
            {!form.associationId
              ? "-- Choisir d'abord une association --"
              : "-- Aucun membre (optionnel) --"}
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
          ))}
        </select>

        <label style={labelStyle}>Message *</label>
        <textarea
          style={{ ...input, minHeight: 80, resize: "vertical" }}
          placeholder="Contenu de la notification"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />

        <label style={labelStyle}>Lien action (optionnel)</label>
        <input
          style={input}
          placeholder="Ex: /cotisations/123"
          value={form.lienAction}
          onChange={(e) => setForm({ ...form, lienAction: e.target.value })}
        />

        <label style={labelStyle}>Date d'expiration (optionnel)</label>
        <input
          style={input}
          type="datetime-local"
          value={form.dateExpiration}
          onChange={(e) => setForm({ ...form, dateExpiration: e.target.value })}
        />

        <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={form.envoyeeParEmail}
            onChange={(e) => setForm({ ...form, envoyeeParEmail: e.target.checked })}
          />
          Envoyer aussi par email
        </label>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            marginTop: 10,
            padding: 10,
            background: submitting ? "#c4b5fd" : "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: submitting ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}>
          {submitting ? "⏳ Enregistrement..." : "💾 Enregistrer"}
        </button>

        {/* ✅ FIX : window.location.href au lieu de navigate */}
        <button
          onClick={() => window.location.href = "/notifications"}
          style={{
            padding: 10,
            background: "#95a5a6",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
          }}>
          ✖️ Annuler
        </button>

      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 590, color: "#555" };
const input: React.CSSProperties = { padding: 10, borderRadius: 6, border: "1px solid #ccc" };