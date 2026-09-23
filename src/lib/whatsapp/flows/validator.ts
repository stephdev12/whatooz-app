import { FlowVersion, ComponentType, isComponentSupported } from './registry';

/**
 * Interface representing the visual state from our React Flow canvas.
 */
export interface VisualScreen {
  id: string;
  title: string;
  terminal?: boolean;
  components: VisualComponent[];
  successAction?: VisualAction;
  errorAction?: VisualAction;
}

export interface VisualComponent {
  id: string;
  type: ComponentType;
  label?: string;
  name?: string;
  required?: boolean;
  helper_text?: string;
  description?: string;
  options?: Array<{ id: string; title: string; description?: string }>;
  // Actions that can be triggered by specific components (e.g., Footer)
  onClickAction?: VisualAction;
  // Allow additional dynamic properties from Meta schema
  [key: string]: any;
}

export type VisualAction = 
  | { type: 'navigate'; nextScreenId: string }
  | { type: 'complete'; payload: Record<string, any> }
  | { type: 'data_exchange'; payload: Record<string, any> };

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates the visual graph and configuration before serialization.
 */
export class FlowValidator {
  
  static validate(screens: VisualScreen[], version: FlowVersion): ValidationResult {
    const errors: string[] = [];
    
    if (!screens || screens.length === 0) {
      return { isValid: false, errors: ['Le Flow doit contenir au moins un écran.'] };
    }

    const screenIds = new Set(screens.map(s => s.id));
    const reachableScreens = new Set<string>();
    
    // Assume the first screen in the array is the initial screen, or look for 'MAIN_SCREEN'
    // Usually Meta assumes the first screen or the screen named explicitly as start.
    reachableScreens.add(screens[0].id);
    
    let hasTerminalScreen = false;

    screens.forEach(screen => {
      // 1. Validate Components against Version
      screen.components.forEach(comp => {
        if (!isComponentSupported(comp.type, version)) {
          errors.push(`L'écran "${screen.title}" utilise le composant "${comp.type}" qui n'est pas supporté par la version Meta ${version}.`);
        }
        
        // Ensure form inputs have a name
        if (['TextInput', 'TextArea', 'Dropdown', 'RadioButtons', 'CheckboxGroup'].includes(comp.type) && !comp.name) {
           errors.push(`Le composant "${comp.type}" dans l'écran "${screen.title}" doit avoir un nom de variable (name) défini.`);
        }
        
        // Action validation for Footer/Buttons
        if (comp.type === 'Footer' && comp.onClickAction) {
           this.validateAction(comp.onClickAction, screen, screenIds, reachableScreens, errors, version);
        }
      });
      
      // 2. Validate screen success/error actions
      if (screen.successAction) {
        this.validateAction(screen.successAction, screen, screenIds, reachableScreens, errors, version);
      }
      if (screen.errorAction) {
        this.validateAction(screen.errorAction, screen, screenIds, reachableScreens, errors, version);
      }
      
      // 3. Terminal status check
      if (screen.terminal) {
        hasTerminalScreen = true;
      }
      
      // A screen with a 'complete' action is effectively terminal
      if (screen.successAction?.type === 'complete' || screen.components.some(c => c.onClickAction?.type === 'complete')) {
         hasTerminalScreen = true;
      }
    });
    
    if (!hasTerminalScreen) {
       errors.push("Le Flow ne contient aucun chemin menant à une action 'complete' ou un écran terminal.");
    }
    
    // Check for unreachable screens (Optional strict check)
    // For now we just warn or log, but Meta allows unreachable screens in JSON, they just won't be seen.
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private static validateAction(
    action: VisualAction, 
    screen: VisualScreen, 
    allScreenIds: Set<string>, 
    reachableScreens: Set<string>, 
    errors: string[],
    version: FlowVersion
  ) {
    if (action.type === 'navigate') {
       if (!allScreenIds.has(action.nextScreenId)) {
         errors.push(`L'écran "${screen.title}" tente de naviguer vers un écran inexistant ("${action.nextScreenId}").`);
       } else {
         reachableScreens.add(action.nextScreenId);
       }
    } else if (action.type === 'data_exchange') {
       // Requires endpoint config, we can't fully validate this here without DB context,
       // but we ensure the payload is well-formed.
       if (!action.payload) {
          errors.push(`L'action Data Exchange dans l'écran "${screen.title}" requiert un payload.`);
       }
    }
  }
}
