import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import { toast } from "react-toastify";

import {
  getCotisations,
  getCotisationById,
  updateCotisation,
} from "../api/cotisationService";
import { getAssociations } from "../api/associationService";
import { memberService } from "../api/memberService";
import { sendEmail } from "../api/emailEnvoyeService";

type StatutCotisation = "EN_ATTENTE" | "PAYEE" | "EN_RETARD" | "ANNULEE";

interface Cotisation {
  id: number;
  montant: number;
  montantPenalite?: number | null;
  devise?: string | null;
  statut: StatutCotisation | string;
  periodeDebut?: string | null;
  periodeFin?: string | null;
  dateEcheance?: string | null;
  memberId?: number | null;
  associationId?: number | null;
  referencePaiement?: string | null;
}

interface AssociationLite {
  id: number;
  name: string;
}

interface MemberLite {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface ReceiptData {
  numero: string;
  date: string;
  association: string;
  membre: string;
  montant: number;
  penalite: number;
  total: number;
  devise: string;
  symbole: string;
  periode: string;
  cotisationId: number;
  memberId?: number | null;
  associationId?: number | null;
}

interface EmailPanel {
  destinataire: string;
  nomExpediteur: string;
  sujet: string;
  contenu: string;
  associationId?: number;
}

const PAGE_SIZE = 10;

const STATUT_META: Record<string, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: "En attente", color: "#92400e", bg: "#fef3c7" },
  PAYEE: { label: "Payée", color: "#065f46", bg: "#d1fae5" },
  EN_RETARD: { label: "En retard", color: "#991b1b", bg: "#fee2e2" },
  ANNULEE: { label: "Annulée", color: "#374151", bg: "#f3f4f6" },
};

const STATUS_FILTERS = ["", "EN_ATTENTE", "EN_RETARD", "PAYEE", "ANNULEE"] as const;

const getCurrencySymbol = (devise?: string | null): string => {
  switch ((devise ?? "EUR").toUpperCase()) {
    case "XAF":
    case "XOF":
      return "FCFA";
    case "USD":
      return "$";
    case "GBP":
      return "£";
    case "GNF":
      return "GNF";
    default:
      return "€";
  }
};

const formatMoney = (amount: number, devise?: string | null): string => {
  return `${Number(amount).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${getCurrencySymbol(devise)}`;
};

const generateReceiptNumber = (): string => {
  return `REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    Math.random() * 1000
  )}`;
};

export default function PaiementPage() {
  const navigate = useNavigate();
  const { cotisationId } = useParams<{ cotisationId: string }>();

  const referenceInputRef = useRef<HTMLInputElement>(null);

  const [cotisations, setCotisations] = useState<Cotisation[]>([]);
  const [selected, setSelected] = useState<Cotisation | null>(null);
  const [associations, setAssociations] = useState<AssociationLite[]>([]);
  const [members, setMembers] = useState<MemberLite[]>([]);

  const [filterStatut, setFilterStatut] = useState<string>("EN_ATTENTE");
  const [page, setPage] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [emailPanel, setEmailPanel] = useState<EmailPanel | null>(null);

  const getAssociationName = useCallback(
    (associationId?: number | null): string => {
      if (!associationId) return "Association inconnue";
      return (
        associations.find((association) => association.id === associationId)
          ?.name ?? `Association #${associationId}`
      );
    },
    [associations]
  );

  const getMemberName = useCallback(
    (memberId?: number | null): string => {
      if (!memberId) return "Membre inconnu";

      const member = members.find((item) => item.id === memberId);

      if (!member) return `Membre #${memberId}`;

      return `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
    },
    [members]
  );

  const getMemberEmail = useCallback(
    (memberId?: number | null): string | null => {
      if (!memberId) return null;
      return members.find((item) => item.id === memberId)?.email ?? null;
    },
    [members]
  );

  const buildReceiptData = useCallback(
    (cotisation: Cotisation, reference: string): ReceiptData => {
      const penalite = cotisation.montantPenalite ?? 0;
      const total = cotisation.montant + penalite;

      return {
        numero: reference,
        date: new Date().toLocaleDateString("fr-FR"),
        association: getAssociationName(cotisation.associationId),
        membre: getMemberName(cotisation.memberId),
        montant: cotisation.montant,
        penalite,
        total,
        devise: cotisation.devise ?? "EUR",
        symbole: getCurrencySymbol(cotisation.devise),
        periode: `${cotisation.periodeDebut ?? "—"} → ${
          cotisation.periodeFin ?? "—"
        }`,
        cotisationId: cotisation.id,
        memberId: cotisation.memberId,
        associationId: cotisation.associationId,
      };
    },
    [getAssociationName, getMemberName]
  );

  const loadReferences = useCallback(async () => {
    try {
      const [associationResponse, memberResponse] = await Promise.all([
        getAssociations({}, 0, 1000),
        memberService.getAll({ page: 0, size: 1000 }),
      ]);

      setAssociations(associationResponse.content ?? []);
      setMembers(memberResponse.content ?? []);
    } catch (error) {
      console.error("Failed to load payment references", error);
      toast.error("Erreur lors du chargement des associations ou membres.");
    }
  }, []);

  const loadCotisations = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await getCotisations(
  { statut: filterStatut ? filterStatut as StatutCotisation : undefined },
  page,
  PAGE_SIZE
 );

      setCotisations(response.content ?? []);
    } catch (error) {
      console.error("Failed to load cotisations", error);
      toast.error("Erreur lors du chargement des cotisations.");
      setCotisations([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatut, page]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    loadCotisations();
  }, [loadCotisations]);

  useEffect(() => {
    const loadSelectedCotisation = async () => {
      if (!cotisationId) return;

      try {
        const data = await getCotisationById(Number(cotisationId));
        setSelected(data);
      } catch (error) {
        console.error("Failed to load selected cotisation", error);
        toast.error("Cotisation introuvable.");
      }
    };

    loadSelectedCotisation();
  }, [cotisationId]);

  const openEmailPanel = (cotisation: Cotisation) => {
    const email = getMemberEmail(cotisation.memberId);

    if (!email) {
      toast.error("Aucun email trouvé pour ce membre.");
      return;
    }

    const associationName = getAssociationName(cotisation.associationId);
    const memberName = getMemberName(cotisation.memberId);
    const total = cotisation.montant + (cotisation.montantPenalite ?? 0);

    setEmailPanel({
      destinataire: email,
      nomExpediteur: associationName,
      associationId: cotisation.associationId ?? undefined,
      sujet: `Reçu de paiement – ${associationName}`,
      contenu: `Bonjour ${memberName},

Veuillez trouver ci-dessous votre reçu de paiement.

Référence : ${cotisation.referencePaiement ?? "—"}
Montant    : ${formatMoney(total, cotisation.devise)}
Date       : ${new Date().toLocaleDateString("fr-FR")}

Cordialement,
${associationName}`,
    });
  };

  const handleSendEmail = async () => {
    if (!emailPanel) return;

    try {
      setIsSendingEmail(true);

      await sendEmail({
        nomExpediteur: emailPanel.nomExpediteur,
        destinataire: emailPanel.destinataire,
        sujet: emailPanel.sujet,
        contenu: emailPanel.contenu,
        associationId: emailPanel.associationId,
      });

      toast.success(`Email envoyé à ${emailPanel.destinataire}`);
      setEmailPanel(null);
    } catch (error) {
      console.error("Failed to send receipt email", error);
      toast.error("Erreur lors de l'envoi de l'email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handlePay = async () => {
    if (!selected) return;

    const reference =
      referenceInputRef.current?.value.trim() || generateReceiptNumber();

    try {
      setIsPaying(true);

      // Backend receives a full cotisation payload because the current service uses PUT update.
      await updateCotisation(selected.id, {
  statut: "PAYEE" as StatutCotisation,
  referencePaiement: reference,
  periodeDebut: selected.periodeDebut ?? undefined,
  periodeFin: selected.periodeFin ?? undefined,
  dateEcheance: selected.dateEcheance ?? undefined,
  devise: selected.devise ?? undefined,
  montant: selected.montant,
  montantPenalite: selected.montantPenalite ?? undefined,
  memberId: selected.memberId ?? undefined,
  associationId: selected.associationId ?? undefined,
});

      const receipt = buildReceiptData(selected, reference);

      setReceiptData(receipt);
      setSelected(null);

      await loadCotisations();

      toast.success("Paiement enregistré avec succès.");
    } catch (error) {
      console.error("Failed to register payment", error);
      toast.error("Erreur lors de l'enregistrement du paiement.");
    } finally {
      setIsPaying(false);
    }
  };

  const buildReceiptPdf = (receipt: ReceiptData) => {
    const doc = new jsPDF({ unit: "mm", format: "a5" });
    const width = doc.internal.pageSize.getWidth();

    doc.setFillColor(29, 78, 216);
    doc.rect(0, 0, width, 42, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("REÇU DE PAIEMENT", width / 2, 18, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(receipt.association, width / 2, 28, { align: "center" });
    doc.text(`N° ${receipt.numero}`, width / 2, 36, { align: "center" });

    let y = 54;

    const row = (label: string, value: string) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text(label, 14, y);

      doc.setTextColor(15, 23, 42);
      doc.text(value, width - 14, y, { align: "right" });

      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 2, width - 14, y + 2);

      y += 11;
    };

    row("Date de paiement", receipt.date);
    row("Association", receipt.association);
    row("Membre", receipt.membre);
    row("Période", receipt.periode);
    row("Référence", receipt.numero);
    row("Cotisation #", String(receipt.cotisationId));

    y += 4;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, width - 28, 36, 3, 3, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.setTextColor(107, 114, 128);
    doc.text("Montant cotisation", 20, y + 10);

    doc.setTextColor(15, 23, 42);
    doc.text(
      `${receipt.montant} ${receipt.symbole}`,
      width - 20,
      y + 10,
      { align: "right" }
    );

    if (receipt.penalite > 0) {
      doc.setTextColor(107, 114, 128);
      doc.text("Pénalité", 20, y + 20);

      doc.setTextColor(220, 38, 38);
      doc.text(
        `+ ${receipt.penalite} ${receipt.symbole}`,
        width - 20,
        y + 20,
        { align: "right" }
      );
    }

    doc.setDrawColor(229, 231, 235);
    doc.line(20, y + 24, width - 20, y + 24);

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(29, 78, 216);
    doc.text("TOTAL PAYÉ", 20, y + 33);
    doc.text(`${receipt.total} ${receipt.symbole}`, width - 20, y + 33, {
      align: "right",
    });

    y += 50;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(156, 163, 175);
    doc.text(
      "Ce reçu est généré automatiquement et fait foi de paiement.",
      width / 2,
      y,
      { align: "center" }
    );
    doc.text(
      `GestAssoc • ${new Date().toLocaleDateString("fr-FR")}`,
      width / 2,
      y + 6,
      { align: "center" }
    );

    return doc;
  };

  const generatePdf = (receipt: ReceiptData) => {
    buildReceiptPdf(receipt).save(`recu-${receipt.numero}.pdf`);
  };

  const totalSelected = useMemo(() => {
    if (!selected) return 0;
    return selected.montant + (selected.montantPenalite ?? 0);
  }, [selected]);

  return (
    <div style={styles.page}>
      <nav style={styles.breadcrumb}>
        <button
          type="button"
          style={styles.breadcrumbButton}
          onClick={() => navigate("/")}
        >
          🏠 Accueil
        </button>

        <span style={styles.breadcrumbSeparator}>›</span>

        <span style={styles.breadcrumbCurrent}>💳 Paiements</span>
      </nav>

      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>💳 Paiements</h1>
          <p style={styles.subtitle}>
            Enregistrez les paiements, générez les reçus PDF et envoyez-les par email.
          </p>
        </div>
      </header>

      <div style={styles.layout}>
        <main>
          <section style={styles.filterCard}>
            <span style={styles.filterLabel}>Statut :</span>

            {STATUS_FILTERS.map((status) => {
              const meta =
                STATUT_META[status] ?? {
                  label: "Tous",
                  color: "#374151",
                  bg: "#f3f4f6",
                };

              const active = filterStatut === status;

              return (
                <button
                  key={status || "ALL"}
                  type="button"
                  onClick={() => {
                    setFilterStatut(status);
                    setPage(0);
                  }}
                  style={{
                    ...styles.statusFilter,
                    background: active
                      ? status
                        ? meta.bg
                        : "#0f172a"
                      : "#f1f5f9",
                    color: active ? (status ? meta.color : "#fff") : "#6b7280",
                  }}
                >
                  {status ? meta.label : "Tous"}
                </button>
              );
            })}
          </section>

          <section style={styles.tableCard}>
            {isLoading ? (
              <div style={styles.emptyBox}>Chargement des cotisations...</div>
            ) : cotisations.length === 0 ? (
              <div style={styles.emptyBox}>
                <div style={styles.emptyIcon}>💸</div>
                Aucune cotisation trouvée.
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    {[
                      "Membre",
                      "Association",
                      "Montant",
                      "Statut",
                      "Échéance",
                      "Action",
                    ].map((header) => (
                      <th key={header} style={styles.th}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {cotisations.map((cotisation, index) => {
                    const statut = STATUT_META[cotisation.statut] ?? STATUT_META.ANNULEE;
                    const isSelected = selected?.id === cotisation.id;
                    const isPayable =
                      cotisation.statut !== "PAYEE" &&
                      cotisation.statut !== "ANNULEE";

                    return (
                      <tr
                        key={cotisation.id}
                        style={{
                          ...styles.tableRow,
                          background: isSelected
                            ? "#eff6ff"
                            : index % 2 === 0
                            ? "#fff"
                            : "#fafafa",
                        }}
                      >
                        <td style={styles.tdStrong}>
                          {getMemberName(cotisation.memberId)}
                        </td>

                        <td style={styles.tdMuted}>
                          {getAssociationName(cotisation.associationId)}
                        </td>

                        <td style={styles.tdAmount}>
                          {formatMoney(cotisation.montant, cotisation.devise)}
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              background: statut.bg,
                              color: statut.color,
                            }}
                          >
                            {statut.label}
                          </span>
                        </td>

                        <td style={styles.tdMuted}>
                          {cotisation.dateEcheance ?? "—"}
                        </td>

                        <td style={styles.td}>
                          {isPayable ? (
                            <button
                              type="button"
                              onClick={() => setSelected(cotisation)}
                              style={{
                                ...styles.payButton,
                                background: isSelected ? "#1d4ed8" : "#eff6ff",
                                color: isSelected ? "#fff" : "#1d4ed8",
                              }}
                            >
                              {isSelected ? "✓ Sélectionné" : "💳 Payer"}
                            </button>
                          ) : (
                            <div style={styles.inlineActions}>
                              <button
                                type="button"
                                onClick={() =>
                                  generatePdf(
                                    buildReceiptData(
                                      cotisation,
                                      cotisation.referencePaiement ??
                                        generateReceiptNumber()
                                    )
                                  )
                                }
                                style={styles.receiptButton}
                              >
                                📄 Reçu
                              </button>

                              <button
                                type="button"
                                onClick={() => openEmailPanel(cotisation)}
                                style={styles.emailButton}
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
            )}
          </section>

          <div style={styles.pagination}>
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((current) => current - 1)}
              style={{
                ...styles.pageButton,
                opacity: page === 0 ? 0.5 : 1,
                cursor: page === 0 ? "not-allowed" : "pointer",
              }}
            >
              ← Précédent
            </button>

            <span style={styles.pageInfo}>Page {page + 1}</span>

            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              style={styles.pageButton}
            >
              Suivant →
            </button>
          </div>
        </main>

        <aside style={styles.sidebar}>
          {selected ? (
            <section style={styles.paymentPanel}>
              <div style={styles.paymentPanelHeader}>
                <div style={styles.panelOverline}>Enregistrer le paiement</div>
                <div style={styles.panelAmount}>
                  {formatMoney(totalSelected, selected.devise)}
                </div>
                <div style={styles.panelSubtitle}>
                  Cotisation #{selected.id} • {getMemberName(selected.memberId)}
                </div>
              </div>

              <div style={styles.paymentPanelBody}>
                <InfoLine label="Membre" value={getMemberName(selected.memberId)} />
                <InfoLine
                  label="Association"
                  value={getAssociationName(selected.associationId)}
                />
                <InfoLine
                  label="Montant"
                  value={formatMoney(selected.montant, selected.devise)}
                />
                <InfoLine
                  label="Pénalité"
                  value={formatMoney(selected.montantPenalite ?? 0, selected.devise)}
                />
                <InfoLine
                  label="Période"
                  value={`${selected.periodeDebut ?? "—"} → ${
                    selected.periodeFin ?? "—"
                  }`}
                />
                <InfoLine label="Échéance" value={selected.dateEcheance ?? "—"} />

                <div style={styles.field}>
                  <label style={styles.label}>Référence paiement</label>
                  <input
                    ref={referenceInputRef}
                    type="text"
                    placeholder="Laisser vide pour auto-générer"
                    style={styles.input}
                  />
                </div>

                <div style={styles.actions}>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    style={styles.cancelButton}
                  >
                    Annuler
                  </button>

                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={isPaying}
                    style={{
                      ...styles.confirmButton,
                      opacity: isPaying ? 0.7 : 1,
                      cursor: isPaying ? "not-allowed" : "pointer",
                    }}
                  >
                    {isPaying ? "Traitement..." : "✅ Confirmer"}
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section style={styles.placeholderPanel}>
              <div style={styles.placeholderIcon}>💳</div>
              <div style={styles.placeholderTitle}>Sélectionnez une cotisation</div>
              <div style={styles.placeholderText}>
                Cliquez sur “Payer” pour enregistrer un paiement.
              </div>
            </section>
          )}

          {receiptData && (
            <section style={styles.receiptPanel}>
              <div style={styles.receiptHeader}>
                <span style={styles.receiptTitle}>📄 Dernier reçu</span>
                <span style={styles.receiptStatus}>Payée</span>
              </div>

              <InfoLine label="N° reçu" value={receiptData.numero} />
              <InfoLine label="Date" value={receiptData.date} />
              <InfoLine label="Membre" value={receiptData.membre} />
              <InfoLine label="Association" value={receiptData.association} />
              <InfoLine
                label="Total payé"
                value={`${receiptData.total} ${receiptData.symbole}`}
              />

              <div style={styles.actions}>
                <button
                  type="button"
                  onClick={() => generatePdf(receiptData)}
                  style={styles.pdfButton}
                >
                  ⬇️ PDF
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openEmailPanel({
                      id: receiptData.cotisationId,
                      montant: receiptData.montant,
                      montantPenalite: receiptData.penalite,
                      devise: receiptData.devise,
                      statut: "PAYEE",
                      referencePaiement: receiptData.numero,
                      memberId: receiptData.memberId,
                      associationId: receiptData.associationId,
                    })
                  }
                  style={styles.sendReceiptButton}
                >
                  📧 Email
                </button>
              </div>
            </section>
          )}
        </aside>
      </div>

      {emailPanel && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.panelOverline}>Nouveau message</div>
                <div style={styles.modalTitle}>📧 Envoyer le reçu</div>
              </div>

              <button
                type="button"
                onClick={() => setEmailPanel(null)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <FormInput
                label="À"
                type="email"
                value={emailPanel.destinataire}
                onChange={(value) =>
                  setEmailPanel((current) =>
                    current ? { ...current, destinataire: value } : current
                  )
                }
              />

              <FormInput
                label="De"
                value={emailPanel.nomExpediteur}
                onChange={(value) =>
                  setEmailPanel((current) =>
                    current ? { ...current, nomExpediteur: value } : current
                  )
                }
              />

              <FormInput
                label="Sujet"
                value={emailPanel.sujet}
                onChange={(value) =>
                  setEmailPanel((current) =>
                    current ? { ...current, sujet: value } : current
                  )
                }
              />

              <div>
                <label style={styles.label}>Message</label>
                <textarea
                  value={emailPanel.contenu}
                  onChange={(event) =>
                    setEmailPanel((current) =>
                      current
                        ? { ...current, contenu: event.target.value }
                        : current
                    )
                  }
                  rows={8}
                  style={styles.textarea}
                />
              </div>

              <div style={styles.actions}>
                <button
                  type="button"
                  onClick={() => setEmailPanel(null)}
                  style={styles.cancelButton}
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  style={{
                    ...styles.sendButton,
                    opacity: isSendingEmail ? 0.7 : 1,
                    cursor: isSendingEmail ? "not-allowed" : "pointer",
                  }}
                >
                  {isSendingEmail ? "Envoi..." : "📤 Envoyer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoLine}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={styles.input}
      />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "system-ui, sans-serif",
    padding: "28px 24px",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    fontSize: 14,
  },
  breadcrumbButton: {
    border: "none",
    background: "transparent",
    color: "#6b7280",
    cursor: "pointer",
    fontWeight: 500,
  },
  breadcrumbSeparator: {
    color: "#9ca3af",
  },
  breadcrumbCurrent: {
    color: "#111827",
    fontWeight: 700,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    color: "#0f172a",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 14,
    color: "#6b7280",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 400px",
    gap: 20,
    alignItems: "start",
  },
  filterCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    padding: "14px 18px",
    marginBottom: 16,
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
  },
  statusFilter: {
    padding: "5px 14px",
    borderRadius: 20,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  tableCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeadRow: {
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
  },
  th: {
    padding: "12px 14px",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tableRow: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "11px 14px",
    fontSize: 14,
    color: "#374151",
  },
  tdStrong: {
    padding: "11px 14px",
    fontSize: 14,
    color: "#374151",
    fontWeight: 700,
  },
  tdMuted: {
    padding: "11px 14px",
    fontSize: 13,
    color: "#6b7280",
  },
  tdAmount: {
    padding: "11px 14px",
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
  },
  statusBadge: {
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  payButton: {
    border: "none",
    padding: "6px 14px",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  inlineActions: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  receiptButton: {
    background: "#f0fdf4",
    color: "#16a34a",
    border: "none",
    padding: "6px 12px",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  emailButton: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "none",
    padding: "6px 12px",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  emptyBox: {
    textAlign: "center",
    padding: 48,
    color: "#9ca3af",
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  pageButton: {
    padding: "7px 16px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontSize: 13,
  },
  pageInfo: {
    fontSize: 14,
    color: "#6b7280",
    alignSelf: "center",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  paymentPanel: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
  },
  paymentPanelHeader: {
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    padding: "18px 22px",
  },
  panelOverline: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  panelAmount: {
    fontSize: 26,
    fontWeight: 800,
    color: "#fff",
    marginTop: 4,
  },
  panelSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  paymentPanelBody: {
    padding: "18px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  infoLine: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: 8,
    gap: 12,
  },
  infoLabel: {
    color: "#6b7280",
    fontWeight: 600,
  },
  infoValue: {
    color: "#0f172a",
    fontWeight: 700,
    textAlign: "right",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "block",
    marginBottom: 5,
  },
  input: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    color: "#111827",
    background: "#fff",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    color: "#111827",
    background: "#fff",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    lineHeight: 1.6,
    resize: "vertical",
    fontFamily: "inherit",
  },
  actions: {
    display: "flex",
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    padding: 11,
    borderRadius: 9,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  confirmButton: {
    flex: 2,
    padding: 11,
    borderRadius: 9,
    border: "none",
    background: "linear-gradient(135deg,#16a34a,#22c55e)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
  },
  placeholderPanel: {
    background: "#fff",
    borderRadius: 14,
    border: "2px dashed #e2e8f0",
    padding: "40px 22px",
    textAlign: "center",
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#374151",
    marginBottom: 6,
  },
  placeholderText: {
    fontSize: 13,
    color: "#9ca3af",
  },
  receiptPanel: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    padding: "18px 22px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },
  receiptHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
  },
  receiptStatus: {
    fontSize: 12,
    background: "#d1fae5",
    color: "#065f46",
    padding: "3px 10px",
    borderRadius: 20,
    fontWeight: 700,
  },
  pdfButton: {
    flex: 1,
    padding: 11,
    borderRadius: 9,
    border: "none",
    background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  sendReceiptButton: {
    flex: 1,
    padding: 11,
    borderRadius: 9,
    border: "none",
    background: "linear-gradient(135deg,#0369a1,#0ea5e9)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  sendButton: {
    flex: 2,
    padding: 11,
    borderRadius: 9,
    border: "none",
    background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    background: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 560,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  modalHeader: {
    background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
    padding: "18px 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: "#fff",
    marginTop: 2,
  },
  closeButton: {
    background: "rgba(255,255,255,0.15)",
    border: "none",
    color: "#fff",
    borderRadius: 8,
    width: 32,
    height: 32,
    fontSize: 18,
    cursor: "pointer",
  },
  modalBody: {
    padding: "20px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
};