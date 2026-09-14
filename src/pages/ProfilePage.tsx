import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, MapPin, Mail, Camera, Check } from 'lucide-react';
import { apiFetch } from '../services/apiClient';

interface ProfilePageProps {
  onOpenSettings: () => void;
}

/**
 * Page de Consultation et Modification du Profil Personnel (RF-22)
 */
export const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenSettings }) => {
  const { user, refreshUser } = useAuth();
  const [nom, setNom] = useState(user?.nom || '');
  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [ville, setVille] = useState(user?.ville || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!user) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData();
    formData.append('nom', nom.trim());
    formData.append('prenom', prenom.trim());
    formData.append('ville', ville.trim());
    if (photoFile) formData.append('photo', photoFile);

    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: formData
      });

      setIsSaving(false);
      if (res.success) {
        setIsEditing(false);
        setSuccessMessage('Profil mis à jour avec succès !');
        await refreshUser();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (e) {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-extrabold text-xl text-text-main">Mon Profil</h2>
          <p className="text-xs text-text-dim">Informations personnelles publiques</p>
        </div>
        <button
          onClick={onOpenSettings}
          className="text-xs font-bold text-accent hover:underline touch-target"
        >
          Paramètres
        </button>
      </div>

      {successMessage && (
        <div className="p-3 rounded-2xl bg-success/15 border border-success/30 text-success text-xs font-semibold text-center animate-in fade-in">
          {successMessage}
        </div>
      )}

      {/* Carte de Profil */}
      <div className="bg-surface border border-custom rounded-3xl p-6 shadow-sm text-center">
        {/* Photo de profil obligatoire (RF-01, RF-22) */}
        <div className="relative w-24 h-24 mx-auto mb-3">
          <div className="w-full h-full rounded-full border-2 border-accent overflow-hidden bg-surface-2 flex items-center justify-center shadow-md">
            {photoPreview || user.photo_profil_url ? (
              <img
                src={photoPreview || user.photo_profil_url}
                alt={user.prenom}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-text-dim" />
            )}
          </div>
          {isEditing && (
            <label className="absolute bottom-0 right-0 p-2 rounded-full bg-accent text-white cursor-pointer shadow-lg hover:scale-105 transition-transform">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/png, image/jpeg" onChange={handlePhotoChange} className="hidden" />
            </label>
          )}
        </div>

        <h3 className="font-display font-extrabold text-lg text-text-main">
          {user.prenom} {user.nom}
        </h3>
        <p className="text-xs text-text-dim mt-0.5">{user.ville}, Côte d&apos;Ivoire</p>
      </div>

      {/* Formulaire ou Affichage des Coordonnées */}
      <div className="bg-surface border border-custom rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-custom pb-3">
          <h4 className="font-display font-bold text-sm text-text-main">Coordonnées</h4>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-bold text-accent hover:underline"
          >
            {isEditing ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">Prénom</label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-surface-2 border border-custom text-xs font-medium text-text-main"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">Nom</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-surface-2 border border-custom text-xs font-medium text-text-main"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">Ville</label>
              <input
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-surface-2 border border-custom text-xs font-medium text-text-main"
              />
            </div>

            <button type="submit" disabled={isSaving} className="btn-cta w-full text-xs mt-2">
              <Check className="w-4 h-4 mr-1 inline" />
              <span>{isSaving ? 'Enregistrement...' : 'Sauvegarder les modifications'}</span>
            </button>
          </form>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-2">
              <Phone className="w-4 h-4 text-accent flex-shrink-0" />
              <div className="text-left">
                <p className="text-[10px] text-text-dim">Contact Mobile Money (Versements)</p>
                <p className="font-mono font-bold text-text-main">{user.contact_paiement}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-2">
              <Mail className="w-4 h-4 text-accent flex-shrink-0" />
              <div className="text-left">
                <p className="text-[10px] text-text-dim">Adresse Email</p>
                <p className="font-semibold text-text-main">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-2">
              <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
              <div className="text-left">
                <p className="text-[10px] text-text-dim">Ville de résidence</p>
                <p className="font-semibold text-text-main">{user.ville}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
