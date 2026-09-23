/**
 * Meta WhatsApp Flows - Version & Component Registry
 * 
 * Defines the supported versions, components, and their compatibility matrices
 * according to the official Meta Documentation.
 */

export const SUPPORTED_VERSIONS = ['2.1', '3.0', '3.1', '4.0', '5.0', '6.0', '6.1', '6.3'] as const;
export type FlowVersion = typeof SUPPORTED_VERSIONS[number];

export type ComponentType = 
  | 'TextHeading'
  | 'TextBody'
  | 'TextCaption'
  | 'TextInput'
  | 'TextArea'
  | 'CheckboxGroup'
  | 'RadioButtons'
  | 'Dropdown'
  | 'DatePicker'
  | 'OptIn'
  | 'Image'
  | 'PhotoPicker'
  | 'DocumentPicker'
  | 'NavigationList'
  | 'EmbeddedLink'
  | 'Form'
  | 'Footer'
  | 'Scale';

// Map of components to the minimum Flow version they require
export const COMPONENT_MIN_VERSION: Record<ComponentType, FlowVersion> = {
  TextHeading: '2.1',
  TextBody: '2.1',
  TextCaption: '2.1',
  TextInput: '2.1',
  TextArea: '2.1',
  CheckboxGroup: '2.1',
  RadioButtons: '2.1',
  Dropdown: '2.1',
  DatePicker: '2.1',
  OptIn: '2.1',
  Image: '2.1',
  Footer: '2.1',
  Form: '2.1',
  
  // Introduced in 3.0+
  EmbeddedLink: '3.0',
  
  // Introduced in 5.0+
  NavigationList: '5.0',
  PhotoPicker: '5.0',
  DocumentPicker: '5.0',
  Scale: '5.0'
};

export interface PropertySchema {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object' | 'dynamic';
  required: boolean;
  options?: string[]; // for enum
  minVersion: FlowVersion;
}

// Minimal definition of properties for basic components to guide the UI properties panel
export const COMPONENT_PROPERTIES: Partial<Record<ComponentType, Record<string, PropertySchema>>> = {
  TextHeading: {
    text: { type: 'string', required: true, minVersion: '2.1' },
  },
  TextBody: {
    text: { type: 'string', required: true, minVersion: '2.1' },
  },
  TextCaption: {
    text: { type: 'string', required: true, minVersion: '2.1' },
  },
  TextInput: {
    label: { type: 'string', required: true, minVersion: '2.1' },
    name: { type: 'string', required: true, minVersion: '2.1' },
    input_type: { type: 'enum', options: ['text', 'number', 'email', 'password'], required: false, minVersion: '2.1' },
    required: { type: 'boolean', required: false, minVersion: '2.1' },
    min_chars: { type: 'number', required: false, minVersion: '2.1' },
    max_chars: { type: 'number', required: false, minVersion: '2.1' },
    helper_text: { type: 'string', required: false, minVersion: '3.1' }, // Added in 3.1
  },
  TextArea: {
    label: { type: 'string', required: true, minVersion: '2.1' },
    name: { type: 'string', required: true, minVersion: '2.1' },
    required: { type: 'boolean', required: false, minVersion: '2.1' },
    max_length: { type: 'number', required: false, minVersion: '2.1' },
    helper_text: { type: 'string', required: false, minVersion: '3.1' },
  },
  CheckboxGroup: {
    name: { type: 'string', required: true, minVersion: '2.1' },
    required: { type: 'boolean', required: false, minVersion: '2.1' },
    min_selected_items: { type: 'number', required: false, minVersion: '2.1' },
    max_selected_items: { type: 'number', required: false, minVersion: '2.1' },
    data_source: { type: 'dynamic', required: true, minVersion: '2.1' }
  },
  RadioButtons: {
    name: { type: 'string', required: true, minVersion: '2.1' },
    required: { type: 'boolean', required: false, minVersion: '2.1' },
    data_source: { type: 'dynamic', required: true, minVersion: '2.1' }
  },
  Dropdown: {
    label: { type: 'string', required: true, minVersion: '2.1' },
    name: { type: 'string', required: true, minVersion: '2.1' },
    required: { type: 'boolean', required: false, minVersion: '2.1' },
    data_source: { type: 'dynamic', required: true, minVersion: '2.1' }
  },
  DatePicker: {
    label: { type: 'string', required: true, minVersion: '2.1' },
    name: { type: 'string', required: true, minVersion: '2.1' },
    required: { type: 'boolean', required: false, minVersion: '2.1' },
    min_date: { type: 'string', required: false, minVersion: '2.1' },
    max_date: { type: 'string', required: false, minVersion: '2.1' },
    unavailable_dates: { type: 'array', required: false, minVersion: '2.1' }
  },
  PhotoPicker: {
    name: { type: 'string', required: true, minVersion: '5.0' },
    label: { type: 'string', required: false, minVersion: '5.0' },
    required: { type: 'boolean', required: false, minVersion: '5.0' },
    max_photos: { type: 'number', required: false, minVersion: '5.0' }
  },
  DocumentPicker: {
    name: { type: 'string', required: true, minVersion: '5.0' },
    label: { type: 'string', required: false, minVersion: '5.0' },
    required: { type: 'boolean', required: false, minVersion: '5.0' },
    max_documents: { type: 'number', required: false, minVersion: '5.0' }
  },
  OptIn: {
    name: { type: 'string', required: true, minVersion: '2.1' },
    label: { type: 'string', required: true, minVersion: '2.1' },
    required: { type: 'boolean', required: false, minVersion: '2.1' }
  }
};

/**
 * Validates if a component is supported in the target Flow version.
 */
export function isComponentSupported(type: ComponentType, version: FlowVersion): boolean {
  const minVersion = COMPONENT_MIN_VERSION[type];
  if (!minVersion) return false;
  
  // Simple lexicographical comparison works for our version formats (2.1, 3.0, etc.)
  return minVersion.localeCompare(version) <= 0;
}
