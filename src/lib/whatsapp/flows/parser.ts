import { VisualScreen, VisualComponent, VisualAction } from './validator';
import { FlowVersion } from './registry';

/**
 * Handles serialization of our internal visual state into Meta's strict JSON Schema
 * and deserialization of Meta JSON back into visual state.
 */
export class FlowJsonSerializer {
  
  /**
   * Converts the Visual Canvas state into a Meta WhatsApp Flow JSON object.
   */
  static serialize(screens: VisualScreen[], version: FlowVersion = '6.0'): Record<string, any> {
    // Sanitize screen IDs to only contain alphabets and underscores (Meta requirement)
    const sanitizeId = (id: string) => id.replace(/[^a-zA-Z_]/g, '').replace(/^_+|_+$/g, '') || 'SCREEN';
    
    // Create a mapping of old IDs to new sanitized IDs to maintain routing
    const idMap: Record<string, string> = {};
    
    // First pass: sanitize all IDs and ensure uniqueness
    const usedIds = new Set<string>();
    const sanitizedScreens = screens.map((screen, index) => {
      let baseSanitized = sanitizeId(screen.id);
      if (baseSanitized === 'SCREEN' || usedIds.has(baseSanitized)) {
         // Append alphabetic representation of index (A, B, C...)
         const char = String.fromCharCode(65 + (index % 26)); // A-Z
         const prefix = Math.floor(index / 26) > 0 ? String.fromCharCode(65 + Math.floor(index / 26) - 1) : '';
         baseSanitized = `${baseSanitized}_${prefix}${char}`;
      }
      usedIds.add(baseSanitized);
      idMap[screen.id] = baseSanitized;
      
      return {
        ...screen,
        id: baseSanitized
      };
    });

    // Determine reachable graph to avoid "Following screens are not connected" Meta error
    const allEdges = new Map<string, string[]>();
    sanitizedScreens.forEach(screen => {
      const edges = [];
      if (screen.successAction?.type === 'navigate' && screen.successAction.nextScreenId) {
        const targetId = idMap[screen.successAction.nextScreenId] || screen.successAction.nextScreenId;
        edges.push(targetId);
      }
      allEdges.set(screen.id, edges);
    });

    const reachable = new Set<string>();
    if (sanitizedScreens.length > 0) {
      const queue = [sanitizedScreens[0].id];
      reachable.add(sanitizedScreens[0].id);
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const neighbors = allEdges.get(curr) || [];
        for (const next of neighbors) {
          if (!reachable.has(next)) {
            reachable.add(next);
            queue.push(next);
          }
        }
      }
    }

    const reachableScreens = sanitizedScreens.filter(s => reachable.has(s.id));
    
    const routingModel: Record<string, string[]> = {};
    reachableScreens.forEach(s => {
      routingModel[s.id] = (allEdges.get(s.id) || []).filter(target => reachable.has(target));
    });

    // --- DATA TRANSFER BFS ---
    // Calculate what variables each screen receives (inVars) and what it passes forward (outVars)
    const inVars = new Map<string, Set<string>>();
    const outVars = new Map<string, Set<string>>();
    
    reachableScreens.forEach(s => {
      inVars.set(s.id, new Set());
      outVars.set(s.id, new Set());
    });

    let changed = true;
    let iterations = 0;
    while (changed && iterations < 100) {
      changed = false;
      iterations++;
      
      for (const s of reachableScreens) {
        const ownVars = new Set<string>();
        s.components.forEach(c => {
          if (c.name && !['Screen', 'Footer', 'OptIn', 'TextHeading', 'TextBody', 'TextCaption'].includes(c.type)) {
            ownVars.add(c.name);
          }
        });
        
        const currentOut = outVars.get(s.id)!;
        const currentIn = inVars.get(s.id)!;
        const newOut = new Set([...currentIn, ...ownVars]);
        
        if (currentOut.size !== newOut.size) {
          outVars.set(s.id, newOut);
          changed = true;
        }
        
        const targets = routingModel[s.id] || [];
        for (const targetId of targets) {
          const targetIn = inVars.get(targetId);
          if (targetIn) {
             const oldSize = targetIn.size;
             newOut.forEach(v => targetIn.add(v));
             if (targetIn.size !== oldSize) {
               changed = true;
             }
          }
        }
      }
    }
    // --- END BFS ---

    const metaScreens = reachableScreens.map(screen => 
      this.serializeScreen(screen, idMap, inVars.get(screen.id)!, outVars.get(screen.id)!)
    );

    return {
      version,
      // data_api_version: "3.0", // Required if version >= 3.0 and using endpoints
      routing_model: routingModel,
      screens: metaScreens,
      // We embed our visual state so we can re-hydrate the canvas later
      _whatooz_visual_state: screens 
    };
  }
  
  private static serializeScreen(
    screen: VisualScreen, 
    idMap: Record<string, string>,
    inVars: Set<string>,
    outVars: Set<string>
  ): Record<string, any> {
    
    // Build payload mapping for all variables leaving this screen (outVars)
    const ownVars = new Set<string>();
    screen.components.forEach(c => {
      if (c.name && !['Screen', 'Footer', 'OptIn', 'TextHeading', 'TextBody', 'TextCaption'].includes(c.type)) {
        ownVars.add(c.name);
      }
    });

    const screenPayload: Record<string, string> = {};
    outVars.forEach(v => {
      if (ownVars.has(v)) {
        screenPayload[v] = `\${form.${v}}`;
      } else if (inVars.has(v)) {
        screenPayload[v] = `\${data.${v}}`;
      }
    });

    const children = screen.components.map(comp => this.serializeComponent(comp, idMap, screen, screenPayload));
    
    // Check if Footer exists, if not we add one automatically
    const hasFooter = children.some(c => c.type === 'Footer');
    
    let injectedFooter: any = null;
    if (!hasFooter) {
      injectedFooter = {
        type: 'Footer',
        label: screen.terminal ? 'Terminer' : 'Continuer',
        'on-click-action': screen.terminal 
          ? { name: 'complete', payload: screenPayload }
          : screen.successAction?.type === 'navigate' && screen.successAction.nextScreenId
            ? { name: 'navigate', next: { type: 'screen', name: idMap[screen.successAction.nextScreenId] || screen.successAction.nextScreenId }, payload: screenPayload }
            : { name: 'complete', payload: screenPayload }
      };
    }

    // Meta requires components to be wrapped in a layout. Form is standard for interactive flows.
    // We group interactive elements in a Form if they have names.
    const formChildren = children.filter(c => c.name || ['Footer', 'OptIn'].includes(c.type));
    const nonFormChildren = children.filter(c => !c.name && !['Footer', 'OptIn'].includes(c.type));

    const layoutChildren = [...nonFormChildren];
    
    if (formChildren.length > 0 || injectedFooter) {
       layoutChildren.push({
         type: 'Form',
         name: `form_${screen.id.toLowerCase()}`,
         children: [...formChildren, ...(injectedFooter ? [injectedFooter] : [])]
       });
    }

    const metaScreen: Record<string, any> = {
      id: screen.id,
      title: screen.title,
      layout: {
        type: 'SingleColumnLayout',
        children: layoutChildren
      }
    };
    
    // Declare all incoming variables in the screen's `data` schema
    if (inVars.size > 0) {
      const dataSchema: Record<string, any> = {};
      inVars.forEach(v => {
        dataSchema[v] = { type: 'string', __example__: 'data' };
      });
      metaScreen.data = dataSchema;
    }

    if (screen.terminal) {
      metaScreen.terminal = true;
    }
    
    return metaScreen;
  }
  
  private static serializeComponent(comp: VisualComponent, idMap: Record<string, string>, screen: VisualScreen, completePayload: Record<string, string>): Record<string, any> {
    const metaComp: Record<string, any> = {
      type: comp.type,
    };
    
    if (comp.label) metaComp.label = comp.label;
    if (comp.name) metaComp.name = comp.name;
    if (comp.required !== undefined) metaComp.required = comp.required;
    
    // Type specific mappings
    if (comp.type === 'TextHeading' || comp.type === 'TextBody' || comp.type === 'TextCaption') {
      metaComp.text = comp.label || '';
      delete metaComp.label; // text fields use 'text'
      delete metaComp.name; // text fields cannot have 'name'
      delete metaComp.required; // text fields cannot have 'required'
    }
    
    // Ensure data-source is present for selection components
    if (['Dropdown', 'RadioButtons', 'CheckboxGroup'].includes(comp.type)) {
      if (comp.options && comp.options.length > 0) {
        metaComp['data-source'] = comp.options;
      } else {
        // Provide a fallback option if none exist to avoid validation error
        metaComp['data-source'] = [{ id: 'default_opt', title: 'Option' }];
      }
    }
    
    // Remove unsupported fields for Form components
    if (['TextInput', 'TextArea'].includes(comp.type)) {
       if (comp.helper_text) metaComp.helper_text = comp.helper_text;
    }
    
    if (comp.type === 'Footer') {
      delete metaComp.name; // Footer cannot have 'name'
      metaComp['on-click-action'] = screen.terminal 
          ? { name: 'complete', payload: completePayload }
          : screen.successAction?.type === 'navigate' && screen.successAction.nextScreenId
            ? { name: 'navigate', next: { type: 'screen', name: idMap[screen.successAction.nextScreenId] || screen.successAction.nextScreenId }, payload: completePayload }
            : { name: 'complete', payload: completePayload };
    } else if (comp.onClickAction) {
      const action = this.serializeAction(comp.onClickAction, idMap);
      if (action.name === 'navigate' || action.name === 'complete') {
        action.payload = completePayload;
      }
      metaComp['on-click-action'] = action;
    }
    
    return metaComp;
  }
  
  private static serializeAction(action: VisualAction, idMap: Record<string, string>): Record<string, any> {
    switch (action.type) {
      case 'navigate':
        return { name: 'navigate', next: { type: 'screen', name: idMap[action.nextScreenId] || action.nextScreenId } };
      case 'complete':
        return { name: 'complete' };
      case 'data_exchange':
        return { name: 'data_exchange', payload: action.payload || {} };
      default:
        return {};
    }
  }

  /**
   * Tries to recover the visual state from a Meta JSON object.
   * If it was created in Whatooz, it uses `_whatooz_visual_state`.
   * Otherwise, it does a best-effort parse.
   */
  static deserialize(flowJson: any): VisualScreen[] {
    if (flowJson._whatooz_visual_state) {
      return flowJson._whatooz_visual_state;
    }
    
    // Best effort parse for external JSONs
    if (!flowJson.screens || !Array.isArray(flowJson.screens)) {
      return [];
    }
    
    return flowJson.screens.map((s: any) => {
       const screen: VisualScreen = {
         id: s.id,
         title: s.title || s.id,
         terminal: s.terminal || false,
         components: []
       };
       
       if (s.layout && s.layout.children) {
         // Flatten forms for our simple internal representation initially
         const extractComponents = (children: any[]) => {
            children.forEach(c => {
               if (c.type === 'Form' && c.children) {
                 extractComponents(c.children);
               } else {
                 screen.components.push(this.deserializeComponent(c));
               }
            });
         };
         extractComponents(s.layout.children);
       }
       
       return screen;
    });
  }
  
  private static deserializeComponent(c: any): VisualComponent {
    return {
       id: c.name || `comp_${Math.random().toString(36).substr(2, 9)}`,
       type: c.type,
       label: c.label || c.text, // depending on component type
       name: c.name,
       required: c.required,
       options: c.data_source,
       // we skip deep action parsing in the fallback for now
    };
  }
}
