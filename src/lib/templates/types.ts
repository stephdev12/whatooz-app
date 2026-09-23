export type TemplateStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAUSED'
  | 'DISABLED'

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'

export type TemplateType =
  | 'STANDARD'
  | 'MEDIA_CAROUSEL'
  | 'PRODUCT_CAROUSEL'

export interface FlowReference {
  mode: 'FLOW_ID' | 'FLOW_NAME' | 'FLOW_JSON'
  flowId?: string
  flowName?: string
  flowJson?: unknown
}

export type TemplateVariable = {
  id: string
  name?: string
  position?: number
  example: string
  source?: {
    type: 'WHATHOOZ_VARIABLE'
    path: string
  }
}

export type TemplateHeader =
  | { type: 'NONE' }
  | { type: 'TEXT'; text: string; variables?: TemplateVariable[] }
  | { type: 'IMAGE'; mediaId?: string; mediaHandle?: string; mediaFilename?: string }
  | { type: 'VIDEO'; mediaId?: string; mediaHandle?: string; mediaFilename?: string }
  | { type: 'DOCUMENT'; mediaId?: string; mediaHandle?: string; mediaFilename?: string }
  | { type: 'LOCATION' }

export interface TemplateBody {
  text: string
  parameterFormat?: 'POSITIONAL' | 'NAMED'
  variables?: TemplateVariable[]
}

export interface TemplateFooter {
  text: string
}

export type TemplateButton =
  | { type: 'QUICK_REPLY'; text: string; id?: string }
  | { type: 'URL'; text: string; url: string; variables?: TemplateVariable[] }
  | { type: 'PHONE_NUMBER'; text: string; phoneNumber: string }
  | { type: 'FLOW'; text: string; flow: FlowReference }
  | { type: 'COPY_CODE'; text?: string; example: string }

export type MediaCarouselCard = {
  index: number
  media:
    | { type: 'IMAGE'; mediaHandle?: string; mediaFilename?: string }
    | { type: 'VIDEO'; mediaHandle?: string; mediaFilename?: string }
  body?: string
  buttons: TemplateButton[]
}

export type ProductCarouselCard = {
  index: number
  buttons: TemplateButton[]
}

export type TemplateCarousel =
  | { type: 'MEDIA'; cards: MediaCarouselCard[] }
  | { type: 'PRODUCT'; cards: ProductCarouselCard[] }

export interface WhatoozTemplate {
  id: string
  organization_id: string
  name: string
  type: TemplateType
  category: TemplateCategory
  language: string
  status: TemplateStatus
  header?: TemplateHeader
  body: TemplateBody
  footer?: TemplateFooter
  buttons?: TemplateButton[]
  carousel?: TemplateCarousel
  flow?: FlowReference
  meta_template_id?: string
  meta_status?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface ValidationResult {
  valid: boolean
  errors: Array<{ message: string; path?: string }>
  warnings: Array<{ message: string; path?: string }>
}
