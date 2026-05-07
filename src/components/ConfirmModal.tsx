// src/components/ConfirmModal.tsx
import React from 'react'

interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmModal({
  isOpen, title, message,
  confirmLabel = 'Supprimer',
  cancelLabel = 'Annuler',
  onConfirm, onCancel,
  danger = true,
}: Props) {
  if (!isOpen) return null

  return (
    // Overlay
    <div style={s.overlay} onClick={onCancel}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* Icône */}
        <div style={{ ...s.iconWrap, background: danger ? '#fef2f2' : '#eff6ff' }}>
          {danger ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2" />
              <path d="M12 8v4m0 4h.01" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </div>

        {/* Titre */}
        <h3 style={s.title}>{title}</h3>

        {/* Message */}
        <p style={s.message}>{message}</p>

        {/* Boutons */}
        <div style={s.actions}>
          <button style={s.btnCancel} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            style={{ ...s.btnConfirm, background: danger ? '#dc2626' : '#2563eb' }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' },
  modal:     { background: '#fff', borderRadius: 16, padding: '32px 36px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  iconWrap:  { width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, textAlign: 'center' },
  message:   { fontSize: 14, color: '#64748b', margin: 0, textAlign: 'center', lineHeight: 1.6 },
  actions:   { display: 'flex', gap: 12, width: '100%', marginTop: 8 },
  btnCancel: { flex: 1, padding: '11px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnConfirm:{ flex: 1, padding: '11px', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}