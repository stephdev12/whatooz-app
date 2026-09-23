import { TemplateCategory, TemplateType } from './types'

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utility' },
  { value: 'AUTHENTICATION', label: 'Authentification' },
]

export const TEMPLATE_LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
]

export const HEADER_TYPES = [
  { value: 'NONE', label: 'Aucun' },
  { value: 'TEXT', label: 'Texte' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'VIDEO', label: 'Vidéo' },
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'LOCATION', label: 'Localisation' },
]

export const BUTTON_TYPES = [
  { value: 'QUICK_REPLY', label: 'Réponse rapide' },
  { value: 'URL', label: 'Lien (URL)' },
  { value: 'PHONE_NUMBER', label: 'Appel téléphonique' },
  { value: 'FLOW', label: 'Ouvrir un Flow Whatooz' },
  { value: 'COPY_CODE', label: 'Copier le code' },
]

export type ComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS' | 'CAROUSEL' | 'CALL_PERMISSION_REQUEST'

export interface TemplateTypeDefinition {
  type: TemplateType
  label: string
  description: string
  allowedCategories: TemplateCategory[]
  allowedComponents: ComponentType[]
}

export const TEMPLATE_TYPE_REGISTRY: Record<TemplateType, TemplateTypeDefinition> = {
  STANDARD: {
    type: 'STANDARD',
    label: 'Message Standard',
    description: 'Message classique avec texte, médias et boutons.',
    allowedCategories: ['MARKETING', 'UTILITY', 'AUTHENTICATION'],
    allowedComponents: ['HEADER', 'BODY', 'FOOTER', 'BUTTONS']
  },
  MEDIA_CAROUSEL: {
    type: 'MEDIA_CAROUSEL',
    label: 'Carrousel Multimédia',
    description: 'Créez un message défilant avec jusqu\'à 10 cartes (images/vidéos).',
    allowedCategories: ['MARKETING'],
    allowedComponents: ['BODY', 'CAROUSEL']
  },
  PRODUCT_CAROUSEL: {
    type: 'PRODUCT_CAROUSEL',
    label: 'Carrousel Produits',
    description: 'Affichez des produits depuis votre catalogue Meta.',
    allowedCategories: ['MARKETING'],
    allowedComponents: ['BODY', 'CAROUSEL']
  }
}
