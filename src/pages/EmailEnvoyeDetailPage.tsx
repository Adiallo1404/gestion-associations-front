import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEmailById, deleteEmail } from "../api/emailEnvoyeService";
import type { EmailEnvoyeDto } from "../types/emailEnvoye";

const EmailDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState<EmailEnvoyeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const data = await getEmailById(Number(id));
        setEmail(data);
      } catch {
        setError("Email introuvable.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEmail();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Supprimer cet email ?")) return;
    try {
      await deleteEmail(Number(id));
      navigate("/emails-envoyes");
    } catch {
      setError("Erreur lors de la suppression.");
    }
  };

  if (loading) return <div className="container mt-4">Chargement...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;
  if (!email) return null;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold">📧 Email #{email.id}</h2>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/emails-envoyes")}>
          ← Retour
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <dl className="row mb-0">
            <dt className="col-sm-3">👤 Destinataire</dt>
            <dd className="col-sm-9">{email.destinataire}</dd>

            <dt className="col-sm-3">📝 Sujet</dt>
            <dd className="col-sm-9">{email.sujet}</dd>

            <dt className="col-sm-3">🏢 Association</dt>
            <dd className="col-sm-9">
              {/* ✅ Corrigé : associationName au lieu de associationNom */}
              {(email as any).associationName || (email as any).associationNom || "—"}
            </dd>

            <dt className="col-sm-3">📅 Date</dt>
            <dd className="col-sm-9">
              {email.dateEnvoi ? new Date(email.dateEnvoi).toLocaleString("fr-FR") : "—"}
            </dd>

            <dt className="col-sm-3">💬 Contenu</dt>
            <dd className="col-sm-9">
              <div className="border rounded p-3 bg-light">
                {email.contenu || <span className="text-muted">Aucun contenu</span>}
              </div>
            </dd>
          </dl>
        </div>

        <div className="card-footer text-end">
          <button className="btn btn-danger shadow-sm" onClick={handleDelete}>
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailDetailPage;