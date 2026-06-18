import { useEffect, useState } from 'react'
import { createCotisation, getCotisationById, updateCotisation } from '../api/cotisationService'
import { getAssociations } from '../api/associationService'
import { memberService } from '../api/memberService'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import type { Association } from '../types/association'
import type { Member } from '../types/member'
import type { CotisationInput, StatutCotisation } from '../types/cotisation'

const DEVISES = [
  { code: 'EUR', label: '€ Euro' },
  { code: 'USD', label: '$ Dollar américain' },
  { code: 'XOF', label: 'FCFA Franc CFA (UEMOA)' },
  { code: 'XAF', label: 'FCFA Franc CFA (CEMAC)' },
  { code: 'GNF', label: 'GNF Franc guinéen' },
  { code: 'MAD', label: 'MAD Dirham marocain' },
  { code: 'DZD', label: 'DZD Dinar algérien' },
  { code: 'TND', label: 'TND Dinar tunisien' },
  { code: 'GBP', label: '£ Livre sterling' },
  { code: 'CHF', label: 'CHF Franc suisse' },
]

const STATUTS: { value: StatutCotisation; label: string }[] = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'PAYEE',      label: 'Payée' },
  { value: 'EN_RETARD',  label: 'En retard' },
  { value: 'ANNULEE',    label: 'Annulée' },
]

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db',
  fontSize: 14, color: '#111827', background: '#fff',
  outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
}
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', appearance: 'none' }

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
      {children}
    </div>
  )
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 12, color: '#9ca3af' }}>▼</span>
    </div>
  )
}

interface FormState {
  montant: string
  montantPenalite: string
  referencePaiement: string
  devise: string
  statut: StatutCotisation
  associationId: string
  memberId: string
  periodeDebut: string
  periodeFin: string
  dateEcheance: string
}

export default function CotisationFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormState>({
    montant: '',
    montantPenalite: '0',
    referencePaiement: '',
    devise: 'EUR',
    statut: 'EN_ATTENTE',
    associationId: '',
    memberId: '',
    periodeDebut: '',
    periodeFin: '',
    dateEcheance: '',
  })

  const [associations, setAssociations] = useState<Association[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)

  const deviseLabel = DEVISES.find(d => d.code === form.devise)?.label ?? form.devise

  // Load associations once, and the existing contribution's data in edit mode.
  useEffect(() => {
    getAssociations({}, 0, 1000).then((res) => setAssociations(res.content))

    if (id) {
      getCotisationById(Number(id)).then((data) => {
        setForm({
          montant: String(data.montant ?? ''),
          montantPenalite: String(data.montantPenalite ?? '0'),
          referencePaiement: data.referencePaiement ?? '',
          devise: data.devise ?? 'EUR',
          statut: data.statut ?? 'EN_ATTENTE',
          associationId: String(data.associationId ?? ''),
          memberId: String(data.memberId ?? ''),
          periodeDebut: data.periodeDebut ?? '',
          periodeFin: data.periodeFin ?? '',
          dateEcheance: data.dateEcheance ?? '',
        })
      })
    }
  }, [id])

  // Reload members whenever the selected association changes.
  useEffect(() => {
    if (form.associationId) {
        memberService.getAll({ associationId: Number(form.associationId), page: 0, size: 1000 }).then((res) => {
        setMembers(res.content)
        if (!id) setForm(prev => ({ ...prev, memberId: '' }))
      })
    } else {
      setMembers([])
    }
  }, [form.associationId])

  const handleChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.montant || Number(form.montant) <= 0) { toast.error('Le montant est obligatoire et doit être strictement positif'); return }
    if (!form.associationId)                        { toast.error('Veuillez choisir une association'); return }
    if (!form.memberId)                              { toast.error('Veuillez choisir un membre'); return }
    if (!form.periodeDebut || !form.periodeFin)      { toast.error('Les périodes de début et de fin sont obligatoires'); return }
    if (form.periodeFin < form.periodeDebut)         { toast.error('La période de fin doit être après la période de début'); return }
    if (Number(form.montantPenalite) < 0)            { toast.error('Le montant de la pénalité ne peut pas être négatif'); return }

    const payload: CotisationInput = {
      montant: Number(form.montant),
      montantPenalite: Number(form.montantPenalite) || 0,
      referencePaiement: form.referencePaiement || undefined,
      devise: form.devise,
      statut: form.statut,
      associationId: Number(form.associationId),
      memberId: Number(form.memberId),
      periodeDebut: form.periodeDebut,
      periodeFin: form.periodeFin,
      dateEcheance: form.dateEcheance || undefined,
    }

    setLoading(true)
    try {
      if (id) {
        await updateCotisation(Number(id), payload)
        toast.success('Cotisation modifiée')
      } else {
        await createCotisation(payload)
        toast.success('Cotisation créée')
      }
      navigate('/cotisations')
    } catch (error: unknown) {
      // Log the raw error for debugging, but show a generic message to the user.
      console.error('Error saving contribution:', error)
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', padding: '32px 16px 48px', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>

        <button
          onClick={() => navigate('/cotisations')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          ← Retour aux cotisations
        </button>

        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          <div style={{ background: '#2563eb', padding: '24px 32px', borderRadius: '16px 16px 0 0' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>
                {isEdit ? 'Modifier la cotisation' : 'Nouvelle cotisation'}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                {isEdit ? `Modification de la cotisation #${id}` : 'Remplissez les informations ci-dessous'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div>
              <SectionTitle>Affectation</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Association" required>
                  <SelectWrapper>
                    <select style={selectStyle} value={form.associationId}
                      onChange={(e) => { handleChange('associationId', e.target.value); handleChange('memberId', '') }}>
                      <option value="">Choisir une association</option>
                      {associations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>
                <Field label="Membre" required>
                  <SelectWrapper>
                    <select
                      style={{ ...selectStyle, background: !form.associationId ? '#f9fafb' : '#fff', color: !form.associationId ? '#9ca3af' : '#111827' }}
                      value={form.memberId}
                      disabled={!form.associationId}
                      onChange={(e) => handleChange('memberId', e.target.value)}>
                      <option value="">{!form.associationId ? "Choisir d'abord une association" : members.length === 0 ? 'Aucun membre' : 'Choisir un membre'}</option>
                      {members.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>
              </div>
            </div>

            <div>
              <SectionTitle>Montant & Devise</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Devise" required>
                  <SelectWrapper>
                    <select style={selectStyle} value={form.devise}
                      onChange={(e) => handleChange('devise', e.target.value)}>
                      {DEVISES.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>

                <Field label={`Montant (${deviseLabel})`} required>
                  <input style={inputStyle} type="number" step="0.01" min="0.01" placeholder="0.00"
                    value={form.montant} onChange={(e) => handleChange('montant', e.target.value)} />
                </Field>

                <Field label={`Pénalité (${deviseLabel})`}>
                  <input style={inputStyle} type="number" step="0.01" min="0" placeholder="0.00"
                    value={form.montantPenalite} onChange={(e) => handleChange('montantPenalite', e.target.value)} />
                </Field>

                <Field label="Référence de paiement">
                  <input style={inputStyle} type="text" placeholder="Ex : VIR-2024-001"
                    value={form.referencePaiement} onChange={(e) => handleChange('referencePaiement', e.target.value)} />
                </Field>
              </div>
            </div>

            <div>
              <SectionTitle>Statut & Dates</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Statut" required>
                  <SelectWrapper>
                    <select style={selectStyle} value={form.statut}
                      onChange={(e) => handleChange('statut', e.target.value)}>
                      {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>

                <Field label="Date d'échéance">
                  <input style={inputStyle} type="date" value={form.dateEcheance}
                    onChange={(e) => handleChange('dateEcheance', e.target.value)} />
                </Field>

                <Field label="Période début" required>
                  <input style={inputStyle} type="date" value={form.periodeDebut}
                    onChange={(e) => handleChange('periodeDebut', e.target.value)} />
                </Field>

                <Field label="Période fin" required>
                  <input style={inputStyle} type="date" value={form.periodeFin}
                    onChange={(e) => handleChange('periodeFin', e.target.value)} />
                </Field>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f3f4f6', marginTop: 4 }}>
              <button type="button" onClick={() => navigate('/cotisations')}
                style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Annuler
              </button>
              <button type="submit" disabled={loading}
                style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: loading ? '#93c5fd' : '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(29,78,216,0.3)' }}>
                {loading ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer la cotisation'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}