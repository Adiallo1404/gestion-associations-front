import { useEffect, useRef, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import { getCotisations, getCotisationById, updateCotisation } from "../api/cotisationService";
import { getAssociations } from "../api/associationService";
import { memberService } from "../api/memberService";
import { sendEmail } from "../api/emailEnvoyeService";
import { toast } from "react-toastify";
import jsPDF from "jspdf";

// ─── Types ────────────────────────────────────────────────────────────────────
type Cotisation = {
  id: number;
  montant: number;
  montantPenalite?: number;
  devise?: string;
  statut: string;
  periodeDebut?: string;
  periodeFin?: string;
  dateEcheance?: string;
  memberId?: number;
  associationId?: number;
  referencePaiement?: string;
};

type EmailPanel = {
  destinataire: string;
  nomExpediteur: string;
  sujet: string;
  contenu: string;
  associationId?: number;
};

const STATUT_META: Record<string, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: "En attente", color: "#92400e", bg: "#fef3c7" },
  PAYEE:      { label: "Payée",      color: "#065f46", bg: "#d1fae5" },
  EN_RETARD:  { label: "En retard",  color: "#991b1b", bg: "#fee2e2" },
  ANNULEE:    { label: "Annulée",    color: "#374151", bg: "#f3f4f6" },
};

const getSymbol = (devise?: string) => {
  switch (devise) {
    case "XAF": case "XOF": return "FCFA";
    case "USD": return "$"; case "GBP": return "£";
    default: return "€";
  }
};

const genReceiptNumber = () =>
  "REC-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 1000);

// ─── Composant ────────────────────────────────────────────────────────────────
export default function PaiementPage() {
  const navigate         = useNavigate();
  const { cotisationId } = useParams();

  const [cotisations, setCotisations]   = useState<Cotisation[]>([]);
  const [selected, setSelected]         = useState<Cotisation | null>(null);
  const [associations, setAssociations] = useState<any[]>([]);
  const [members, setMembers]           = useState<any[]>([]);
  const [filterStatut, setFilterStatut] = useState("EN_ATTENTE");
  const [paying, setPaying]             = useState(false);
  const [receiptData, setReceiptData]   = useState<any | null>(null);
  const [page, setPage]                 = useState(0);
  const [emailPanel, setEmailPanel]     = useState<EmailPanel | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const refPaiementRef = useRef<HTMLInputElement>(null);

  // ── Chargement ──────────────────────────────────────────────────────────────
  useEffect(() => {
    getAssociations(0, 1000).then(r => setAssociations(r.content));
    memberService.getAll({ page: 0, size: 1000 }).then(r => setMembers(r.content));
  }, []);

  useEffect(() => {
    getCotisations({ statut: filterStatut || undefined }, page)
      .then(r => setCotisations(r.content));
  }, [filterStatut, page]);

  useEffect(() => {
    if (cotisationId) getCotisationById(Number(cotisationId)).then(setSelected);
  }, [cotisationId]);

  const getAssocName  = (id?: number) => associations.find(a => a.id === id)?.name || `#${id}`;
  const getMemberName = (id?: number) => { const m = members.find(m => m.id === id); return m ? `${m.firstName} ${m.lastName}` : `#${id}`; };
  const getMemberEmail = (id?: number) => members.find(m => m.id === id)?.email || null;

  // ── Ouvrir le panneau email ───────────────────────────────────────────────
  const openEmailPanel = (c: Cotisation) => {
    const email = getMemberEmail(c.memberId);
    if (!email) { toast.error("❌ Aucun email trouvé pour ce membre."); return; }
    setEmailPanel({
      destinataire:   email,
      nomExpediteur:  getAssocName(c.associationId),
      associationId:  c.associationId,
      sujet:          `Reçu de paiement – ${getAssocName(c.associationId)}`,
      contenu:
`Bonjour ${getMemberName(c.memberId)},

Veuillez trouver ci-dessous votre reçu de paiement.

Référence : ${c.referencePaiement || "—"}
Montant    : ${c.montant + (c.montantPenalite || 0)} ${getSymbol(c.devise)}
Date       : ${new Date().toLocaleDateString("fr-FR")}

Cordialement,
${getAssocName(c.associationId)}`,
    });
  };

  // ── Envoi email via emailService (axiosInstance) ──────────────────────────
  const handleSendEmail = async () => {
    if (!emailPanel) return;
    setSendingEmail(true);
    try {
      await sendEmail({
        nomExpediteur: emailPanel.nomExpediteur,
        destinataire:  emailPanel.destinataire,
        sujet:         emailPanel.sujet,
        contenu:       emailPanel.contenu,
        associationId: emailPanel.associationId ?? undefined,
      });
      toast.success(`✅ Email envoyé à ${emailPanel.destinataire}`);
      setEmailPanel(null);
    } catch {
      toast.error("❌ Erreur lors de l'envoi de l'email.");
    } finally {
      setSendingEmail(false);
    }
  };

  // ── Paiement ──────────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!selected) return;
    setPaying(true);
    const ref = refPaiementRef.current?.value || genReceiptNumber();
    try {
      await updateCotisation(selected.id, { ...selected, statut: "PAYEE", referencePaiement: ref });
      const receipt = {
        numero:       ref,
        date:         new Date().toLocaleDateString("fr-FR"),
        association:  getAssocName(selected.associationId),
        membre:       getMemberName(selected.memberId),
        montant:      selected.montant,
        penalite:     selected.montantPenalite || 0,
        total:        selected.montant + (selected.montantPenalite || 0),
        devise:       selected.devise || "EUR",
        symbole:      getSymbol(selected.devise),
        periode:      `${selected.periodeDebut || "—"} → ${selected.periodeFin || "—"}`,
        cotisationId: selected.id,
        memberId:     selected.memberId,
        associationId: selected.associationId,
      };
      setReceiptData(receipt);
      toast.success("✅ Paiement enregistré !");
      getCotisations({ statut: filterStatut || undefined }, page).then(r => setCotisations(r.content));
      setSelected(null);
    } catch {
      toast.error("❌ Erreur lors du paiement");
    } finally {
      setPaying(false);
    }
  };

  // ── PDF ───────────────────────────────────────────────────────────────────
  const buildDoc = (r: any) => {
    const doc = new jsPDF({ unit: "mm", format: "a5" });
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(29, 78, 216); doc.rect(0, 0, W, 42, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont("helvetica", "bold");
    doc.text("REÇU DE PAIEMENT", W / 2, 18, { align: "center" });
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text(r.association, W / 2, 28, { align: "center" });
    doc.text(`N° ${r.numero}`, W / 2, 36, { align: "center" });
    doc.setTextColor(15, 23, 42);
    let y = 54;
    const row = (label: string, value: string) => {
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128); doc.text(label, 14, y);
      doc.setTextColor(15, 23, 42); doc.text(value, W - 14, y, { align: "right" });
      doc.setDrawColor(241, 245, 249); doc.line(14, y + 2, W - 14, y + 2);
      y += 11;
    };
    row("Date de paiement", r.date);
    row("Association",      r.association);
    row("Membre",           r.membre);
    row("Période",          r.periode);
    row("Référence",        r.numero);
    row("Cotisation #",     String(r.cotisationId));
    y += 4;
    doc.setFillColor(248, 250, 252); doc.roundedRect(14, y, W - 28, 36, 3, 3, "F");
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128); doc.text("Montant cotisation", 20, y + 10);
    doc.setTextColor(15, 23, 42); doc.text(`${r.montant} ${r.symbole}`, W - 20, y + 10, { align: "right" });
    if (r.penalite > 0) {
      doc.setTextColor(107, 114, 128); doc.text("Pénalité", 20, y + 20);
      doc.setTextColor(220, 38, 38); doc.text(`+ ${r.penalite} ${r.symbole}`, W - 20, y + 20, { align: "right" });
    }
    doc.setDrawColor(229, 231, 235); doc.line(20, y + 24, W - 20, y + 24);
    doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(29, 78, 216);
    doc.text("TOTAL PAYÉ", 20, y + 33);
    doc.text(`${r.total} ${r.symbole}`, W - 20, y + 33, { align: "right" });
    y += 50;
    doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.setTextColor(156, 163, 175);
    doc.text("Ce reçu est généré automatiquement et fait foi de paiement.", W / 2, y, { align: "center" });
    doc.text(`GestAssoc • ${new Date().toLocaleDateString("fr-FR")}`, W / 2, y + 6, { align: "center" });
    return doc;
  };

  const generatePDF = (r: any) => buildDoc(r).save(`recu-${r.numero}.pdf`);

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db",
    fontSize: 14, color: "#111827", background: "#fff",
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#6b7280",
    textTransform: "uppercase", letterSpacing: "0.05em",
    display: "block", marginBottom: 5,
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", padding: "28px 24px" }}>

      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 14 }}>
        <span style={{ color: "#6b7280", cursor: "pointer", fontWeight: 500 }} onClick={() => navigate("/")}>🏠 Accueil</span>
        <span style={{ color: "#9ca3af" }}>›</span>
        <span style={{ color: "#111827", fontWeight: 600 }}>💳 Paiements</span>
      </nav>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#0f172a" }}>💳 Paiements</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6b7280" }}>Enregistrez les paiements et générez les reçus PDF</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20, alignItems: "start" }}>

        {/* ── Liste cotisations ──────────────────────────────────────────── */}
        <div>
          {/* Filtre statut */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "14px 18px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Statut :</span>
            {["", "EN_ATTENTE", "EN_RETARD", "PAYEE", "ANNULEE"].map(s => {
              const meta = STATUT_META[s] || { label: "Tous", color: "#374151", bg: "#f3f4f6" };
              const active = filterStatut === s;
              return (
                <button key={s} onClick={() => { setFilterStatut(s); setPage(0); }}
                  style={{ padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: active ? (s ? meta.bg : "#0f172a") : "#f1f5f9", color: active ? (s ? meta.color : "#fff") : "#6b7280" }}>
                  {s ? meta.label : "Tous"}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                  {["Membre", "Association", "Montant", "Statut", "Échéance", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cotisations.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>💸</div>Aucune cotisation
                  </td></tr>
                )}
                {cotisations.map((c, i) => {
                  const st = STATUT_META[c.statut] || STATUT_META.ANNULEE;
                  const isSelected = selected?.id === c.id;
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9", background: isSelected ? "#eff6ff" : i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "11px 14px", fontSize: 14, color: "#374151", fontWeight: 500 }}>{getMemberName(c.memberId)}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#6b7280" }}>{getAssocName(c.associationId)}</td>
                      <td style={{ padding: "11px 14px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{c.montant} {getSymbol(c.devise)}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ background: st.bg, color: st.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{st.label}</span>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#6b7280" }}>{c.dateEcheance || "—"}</td>
                      <td style={{ padding: "11px 14px" }}>
                        {c.statut !== "PAYEE" && c.statut !== "ANNULEE" ? (
                          <button onClick={() => setSelected(c)}
                            style={{ background: isSelected ? "#1d4ed8" : "#eff6ff", color: isSelected ? "#fff" : "#1d4ed8", border: "none", padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            {isSelected ? "✓ Sélectionné" : "💳 Payer"}
                          </button>
                        ) : (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => {
                                const r = {
                                  numero: c.referencePaiement || genReceiptNumber(),
                                  date: new Date().toLocaleDateString("fr-FR"),
                                  association: getAssocName(c.associationId),
                                  membre: getMemberName(c.memberId),
                                  montant: c.montant, penalite: c.montantPenalite || 0,
                                  total: c.montant + (c.montantPenalite || 0),
                                  devise: c.devise || "EUR", symbole: getSymbol(c.devise),
                                  periode: `${c.periodeDebut || "—"} → ${c.periodeFin || "—"}`,
                                  cotisationId: c.id,
                                };
                                generatePDF(r);
                              }}
                              style={{ background: "#f0fdf4", color: "#16a34a", border: "none", padding: "6px 12px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                            >
                              📄 Reçu
                            </button>
                            <button
                              onClick={() => openEmailPanel(c)}
                              style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", padding: "6px 12px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                            >
                              📧 Email
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: page === 0 ? "#f9fafb" : "#fff", color: page === 0 ? "#9ca3af" : "#374151", cursor: page === 0 ? "not-allowed" : "pointer", fontSize: 13 }}>
              ← Précédent
            </button>
            <span style={{ fontSize: 14, color: "#6b7280", alignSelf: "center" }}>Page {page + 1}</span>
            <button onClick={() => setPage(p => p + 1)}
              style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#374151", cursor: "pointer", fontSize: 13 }}>
              Suivant →
            </button>
          </div>
        </div>

        {/* ── Panneau droit ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {selected ? (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
              <div style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", padding: "18px 22px" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Enregistrer le paiement</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginTop: 4 }}>
                  {selected.montant + (selected.montantPenalite || 0)} {getSymbol(selected.devise)}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                  Cotisation #{selected.id} • {getMemberName(selected.memberId)}
                </div>
              </div>
              <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  ["Membre",      getMemberName(selected.memberId)],
                  ["Association", getAssocName(selected.associationId)],
                  ["Montant",     `${selected.montant} ${getSymbol(selected.devise)}`],
                  ["Pénalité",    `${selected.montantPenalite || 0} ${getSymbol(selected.devise)}`],
                  ["Période",     `${selected.periodeDebut || "—"} → ${selected.periodeFin || "—"}`],
                  ["Échéance",    selected.dateEcheance || "—"],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                    <span style={{ color: "#6b7280", fontWeight: 500 }}>{label}</span>
                    <span style={{ color: "#0f172a", fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Référence paiement</label>
                  <input ref={refPaiementRef} style={inputStyle} type="text" placeholder="Laisser vide pour auto-générer" defaultValue="" />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button onClick={() => setSelected(null)}
                    style={{ flex: 1, padding: "11px", borderRadius: 9, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    Annuler
                  </button>
                  <button onClick={handlePay} disabled={paying}
                    style={{ flex: 2, padding: "11px", borderRadius: 9, border: "none", background: paying ? "#93c5fd" : "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: paying ? "not-allowed" : "pointer" }}>
                    {paying ? "Traitement…" : "✅ Confirmer le paiement"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 14, border: "2px dashed #e2e8f0", padding: "40px 22px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Sélectionnez une cotisation</div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>Cliquez sur "💳 Payer" dans la liste pour enregistrer un paiement</div>
            </div>
          )}

          {receiptData && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>📄 Dernier reçu</span>
                <span style={{ fontSize: 12, background: "#d1fae5", color: "#065f46", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>Payée</span>
              </div>
              {[
                ["N° reçu",     receiptData.numero],
                ["Date",        receiptData.date],
                ["Membre",      receiptData.membre],
                ["Association", receiptData.association],
                ["Total payé",  `${receiptData.total} ${receiptData.symbole}`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid #f1f5f9", paddingBottom: 7, marginBottom: 7 }}>
                  <span style={{ color: "#6b7280" }}>{label}</span>
                  <span style={{ color: "#0f172a", fontWeight: 600 }}>{value}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => generatePDF(receiptData)}
                  style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  ⬇️ PDF
                </button>
                <button
                  onClick={() => openEmailPanel({
                    id:             receiptData.cotisationId,
                    montant:        receiptData.montant,
                    montantPenalite: receiptData.penalite,
                    devise:         receiptData.devise,
                    statut:         "PAYEE",
                    referencePaiement: receiptData.numero,
                    memberId:       receiptData.memberId,
                    associationId:  receiptData.associationId,
                  })}
                  style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#0369a1,#0ea5e9)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  📧 Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal email ───────────────────────────────────────────────────── */}
      {emailPanel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>

            {/* Header modal */}
            <div style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nouveau message</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 2 }}>📧 Envoyer le reçu par email</div>
              </div>
              <button onClick={() => setEmailPanel(null)}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ✕
              </button>
            </div>

            {/* Corps modal */}
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>

              <div>
                <label style={labelStyle}>À</label>
                <input type="email" value={emailPanel.destinataire}
                  onChange={e => setEmailPanel(p => p && ({ ...p, destinataire: e.target.value }))}
                  style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>De (nom affiché)</label>
                <input type="text" value={emailPanel.nomExpediteur}
                  onChange={e => setEmailPanel(p => p && ({ ...p, nomExpediteur: e.target.value }))}
                  style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Sujet</label>
                <input type="text" value={emailPanel.sujet}
                  onChange={e => setEmailPanel(p => p && ({ ...p, sujet: e.target.value }))}
                  style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Message</label>
                <textarea value={emailPanel.contenu}
                  onChange={e => setEmailPanel(p => p && ({ ...p, contenu: e.target.value }))}
                  rows={8}
                  style={{ ...inputStyle, lineHeight: 1.6, resize: "vertical", fontFamily: "inherit" }} />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setEmailPanel(null)}
                  style={{ flex: 1, padding: "11px", borderRadius: 9, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Annuler
                </button>
                <button onClick={handleSendEmail} disabled={sendingEmail}
                  style={{ flex: 2, padding: "11px", borderRadius: 9, border: "none", background: sendingEmail ? "#93c5fd" : "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: sendingEmail ? "not-allowed" : "pointer" }}>
                  {sendingEmail ? "Envoi en cours…" : "📤 Envoyer l'email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}