import { useEffect, useState } from "react";
import {
  createMember,
  getMemberById,
  updateMember,
} from "../api/memberService";
import { getAssociations } from "../api/associationService";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

export default function MemberFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<any>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    associationId: "",
  });

  const [associations, setAssociations] = useState<any[]>([]);

  useEffect(() => {
    // 🔥 charger toutes les associations
    getAssociations(0, 1000).then((res) => setAssociations(res.content));

    if (id) {
      getMemberById(Number(id)).then((data) => {
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          associationId: data.association?.id || "", 
        });
      });
    }
  }, [id]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // 🔥 VALIDATION
    if (!form.firstName || !form.lastName) {
      toast.error("⚠️ Nom et prénom obligatoires");
      return;
    }

    if (!form.associationId) {
      toast.error("⚠️ Choisir une association");
      return;
    }

    const payload = {
      ...form,
      associationId: Number(form.associationId), // ✅ conversion propre
    };

    try {
      if (id) {
        await updateMember(Number(id), payload);
        toast.success("✅ Membre modifié !");
      } else {
        await createMember(payload);
        toast.success("✅ Membre créé !");
      }

      navigate("/members");
    } catch (err) {
      console.error(err);
      toast.error("❌ Erreur lors de l'enregistrement");
    }
  };

  return (
    <div style={container}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={title}>
          {id ? "✏️ Modifier un membre" : "➕ Créer un membre"}
        </h2>

        <input
          style={input}
          placeholder="Prénom"
          value={form.firstName}
          onChange={(e) =>
            setForm({ ...form, firstName: e.target.value })
          }
        />

        <input
          style={input}
          placeholder="Nom"
          value={form.lastName}
          onChange={(e) =>
            setForm({ ...form, lastName: e.target.value })
          }
        />

        <input
          style={input}
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          style={input}
          placeholder="Téléphone"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />

        <input
          style={input}
          placeholder="Adresse"
          value={form.address}
          onChange={(e) =>
            setForm({ ...form, address: e.target.value })
          }
        />

        {/* ✅ SELECT CORRIGÉ */}
        <select
          style={input}
          value={form.associationId}
          onChange={(e) =>
            setForm({
              ...form,
              associationId: e.target.value || "",
            })
          }
        >
          <option value="">-- Choisir une association --</option>
          {associations.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <button type="submit" style={btnSave}>
          💾 {id ? "Mettre à jour" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}

/* 🎨 STYLES */

const container = {
  display: "flex",
  justifyContent: "center",
  marginTop: "40px",
  background: "#f4f6f9",
  minHeight: "100vh",
};

const formStyle = {
  background: "white",
  padding: "30px",
  borderRadius: "12px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  width: "400px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
};

const title = {
  textAlign: "center" as const,
  color: "#2c3e50",
};

const input = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const btnSave = {
  padding: "12px",
  background: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};