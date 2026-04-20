import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLienById, deleteLien } from "../api/lienPartageService";
import type { LienPartage } from "../types/lienPartage";

const LienPartageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lien, setLien] = useState<LienPartage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLien = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLienById(Number(id));
        setLien(data);
      } catch {
        setError("Lien de partage introuvable.");
      } finally {
        setLoading(false);
      }
    };
    fetchLien();
  }, [id]);

  const handleDelete = async () => {
    if (!lien?.id) return;
    if (!window.confirm("Supprimer ce lien de partage ?")) return;
    try {
      await deleteLien(lien.id);
      navigate("/liens-partage");
    } catch {
      setError("Erreur lors de la suppression.");
    }
  };

  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleString("fr-FR") : "-";

  if (loading) return <div className="container mt-4">Chargement...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;
  if (!lien) return null;

  const isValide =
    lien.actif &&
    lien.dateExpiration &&
    new Date() < new Date(lien.dateExpiration) &&
    (lien.nombreAccesMax == null || (lien.nombreAccesActuel ?? 0) < lien.nombreAccesMax);

  return (
    <div className="container mt-4" style={{ maxWidth: 700 }}>
      <h2>Détail du lien de partage</h2>

      <div className="card mt-3">
        <div className="card-body">
          <table className="table table-borderless mb-0">
            <tbody>
              <tr>
                <th style={{ width: 200 }}>ID</th>
                <td>{lien.id}</td>
              </tr>
              <tr>
                <th>Token</th>
                <td>
                  <span style={{ fontFamily: "monospace", fontSize: "0.9rem", wordBreak: "break-all" }}>
                    {lien.token}
                  </span>
                </td>
              </tr>
              <tr>
                <th>Statut</th>
                <td>
                  <span className={`badge me-1 ${lien.actif ? "bg-success" : "bg-secondary"}`}>
                    {lien.actif ? "Actif" : "Inactif"}
                  </span>
                  <span className={`badge ${isValide ? "bg-primary" : "bg-warning text-dark"}`}>
                    {isValide ? "Valide" : "Expiré / Épuisé"}
                  </span>
                </td>
              </tr>
              <tr>
                <th>Date de création</th>
                <td>{formatDate(lien.dateCreation)}</td>
              </tr>
              <tr>
                <th>Date d'expiration</th>
                <td>{formatDate(lien.dateExpiration)}</td>
              </tr>
              <tr>
                <th>Date d'utilisation</th>
                <td>{formatDate(lien.dateUtilisation)}</td>
              </tr>
              <tr>
                <th>Accès actuel</th>
                <td>{lien.nombreAccesActuel ?? 0}</td>
              </tr>
              <tr>
                <th>Accès maximum</th>
                <td>{lien.nombreAccesMax ?? "∞"}</td>
              </tr>
              <tr>
                <th>Document ID</th>
                <td>{lien.documentId}</td>
              </tr>
              <tr>
                <th>Créé par (User ID)</th>
                <td>{lien.creeParId ?? "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-danger" onClick={handleDelete}>Supprimer</button>
        <button className="btn btn-secondary" onClick={() => navigate("/liens-partage")}>
          Retour à la liste
        </button>
      </div>
    </div>
  );
};

export default LienPartageDetailPage;