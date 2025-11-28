export interface Chorale {
  id: string
  nom: string
  slug?: string
  description?: string
  logo_url?: string
  couleur_theme?: string
  email_contact?: string
  telephone?: string
  adresse?: string
  ville?: string
  pays?: string
  site_web?: string
  nombre_membres?: number
  statut?: string
  created_at: string
  updated_at?: string
  // Champs calculés
  nb_membres?: number
  nb_chants?: number
  // Rétrocompatibilité
  actif?: boolean
}
