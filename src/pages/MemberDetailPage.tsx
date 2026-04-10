import { useEffect, useState } from "react";
import { getMemberById, deleteMember } from "../api/memberService";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

export default function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [member, setMember] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const data = await getMemberById(Number(id));
      setMember(data);
    } catch {
      toast.error("❌ Erreur chargement");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer ce membre ?")) return;
    await deleteMember(Number(id));
    toast.success("🗑️ Supprimé !");
    navigate("/members");
  };

  if (!member) return <p>Chargement...</p>;

  return (
    <div style={container}>
      <div style={card}>
        <button style={btnBack} onClick={() => navigate("/members")}>
          ← Retour
        </button>

        <h2 style={title as any}>
          👤 {member.firstName} {member.lastName}
        </h2>

        <p>Email : {member.email}</p>
        <p>Téléphone : {member.phone}</p>
        <p>Adresse : {member.address || "-"}</p>
        {/* ✅ FIX : association est un objet imbriqué */}
        <p>Association : {member.association?.name || "-"}</p>

        <div style={{ marginTop: "20px" }}>
          <button style={btnEdit} onClick={() => navigate(`/members/${id}/edit`)}>
            ✏️ Modifier
          </button>
          <button style={btnDelete} onClick={handleDelete}>
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

const container = { display: "flex", justifyContent: "center", marginTop: "40px" };
const card = { background: "white", padding: "20px", borderRadius: "10px", minWidth: "350px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" };
const title = { textAlign: "center", fontSize: "20px" };
const btnEdit = { marginRight: "10px", background: "#27ae60", color: "white", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer" };
const btnDelete = { background: "#e74c3c", color: "white", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer" };
const btnBack = { marginBottom: "10px", background: "none", border: "1px solid #ccc", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" };