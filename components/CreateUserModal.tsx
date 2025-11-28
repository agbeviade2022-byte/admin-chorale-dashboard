"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";

interface Chorale {
  id: string;
  nom: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "membre",
    chorale_id: "",
  });
  const [chorales, setChorales] = useState<Chorale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      void fetchChorales();
    }
  }, [isOpen]);

  async function fetchChorales() {
    try {
      const { data, error } = await supabase
        .from("chorales")
        .select("id, nom")
        .order("nom");

      if (error) throw error;
      setChorales(data || []);
    } catch (err) {
      console.error("Erreur chargement chorales:", err);
    }
  }

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      role: "membre",
      chorale_id: "",
    });
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (!formData.full_name.trim()) {
        throw new Error("Le nom complet est requis");
      }
      if (!formData.email.trim()) {
        throw new Error("L'email est requis");
      }

      // Appel de la fonction RPC admin_create_user (à créer côté SQL)
      const { error: rpcError } = await supabase.rpc("admin_create_user", {
        p_email: formData.email.trim(),
        p_full_name: formData.full_name.trim(),
        p_role: formData.role,
        p_chorale_id: formData.chorale_id || null,
      });

      if (rpcError) {
        console.error("Erreur admin_create_user:", rpcError);
        throw rpcError;
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("Erreur création utilisateur:", err);
      setError(err.message || "Erreur lors de la création de l'utilisateur");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Ajouter un utilisateur</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nom complet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Jean Dupont"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="exemple@domaine.com"
              required
            />
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="membre">Membre</option>
              <option value="admin">Administrateur</option>
              <option value="super_admin">Super Administrateur</option>
            </select>
          </div>

          {/* Chorale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chorale (optionnel)
            </label>
            <select
              value={formData.chorale_id}
              onChange={(e) =>
                setFormData({ ...formData, chorale_id: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Aucune chorale</option>
              {chorales.map((chorale) => (
                <option key={chorale.id} value={chorale.id}>
                  {chorale.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Création..." : "Créer l'utilisateur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
