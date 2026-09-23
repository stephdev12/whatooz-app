import { WhatoozTemplate } from './types'

// Structure attendue par l'API Meta (WhatsApp Graph API)
export interface MetaTemplatePayload {
  name: string
  language: string
  category: string
  components: any[]
}

export function compileTemplate(template: WhatoozTemplate): MetaTemplatePayload {
  const payload: MetaTemplatePayload = {
    name: template.name,
    language: template.language,
    category: template.category,
    components: [],
  }

  // Compile Header
  if (template.header && template.header.type !== 'NONE') {
    const headerComponent: any = {
      type: 'HEADER',
      format: template.header.type,
    }
    
    if (template.header.type === 'TEXT') {
      headerComponent.text = template.header.text
      if (template.header.variables && template.header.variables.length > 0) {
        // Meta expects 'example' inside 'example.header_text'
        headerComponent.example = {
          header_text: template.header.variables.map(v => v.example)
        }
      }
    } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(template.header.type)) {
      if ('mediaHandle' in template.header && template.header.mediaHandle) {
        headerComponent.example = {
          header_handle: [template.header.mediaHandle]
        }
      } else if ('mediaId' in template.header && template.header.mediaId) {
        // Fallback for some API versions
      }
    }

    payload.components.push(headerComponent)
  }

  // Compile Body
  const bodyComponent: any = {
    type: 'BODY',
    text: template.body.text,
  }

  if (template.body.variables && template.body.variables.length > 0) {
    if (template.body.parameterFormat === 'NAMED') {
      bodyComponent.add_security_recommendation = false
      // Named variables format is supported in newer Graph API versions
      // For now, Meta mostly uses Positional {{1}}, {{2}} in standard payload, 
      // but named variables are passed via 'example.body_text_named_params'
      const namedParams = template.body.variables.map(v => ({
        param_name: v.name,
        example: v.example
      }))
      bodyComponent.example = {
        body_text_named_params: namedParams
      }
    } else {
      // Positional
      // Make sure they are sorted by position
      const sortedVars = [...template.body.variables].sort((a, b) => (a.position || 0) - (b.position || 0))
      bodyComponent.example = {
        body_text: [sortedVars.map(v => v.example)]
      }
    }
  }

  payload.components.push(bodyComponent)

  // Compile Footer
  if (template.footer?.text) {
    payload.components.push({
      type: 'FOOTER',
      text: template.footer.text,
    })
  }

  // Compile Buttons
  if (template.buttons && template.buttons.length > 0) {
    const buttonsComponent: any = {
      type: 'BUTTONS',
      buttons: [],
    }

    template.buttons.forEach(btn => {
      if (btn.type === 'QUICK_REPLY') {
        buttonsComponent.buttons.push({
          type: 'QUICK_REPLY',
          text: btn.text,
        })
      } else if (btn.type === 'URL') {
        const urlBtn: any = {
          type: 'URL',
          text: btn.text,
          url: btn.url,
        }
        if (btn.variables && btn.variables.length > 0) {
          urlBtn.example = [btn.variables.map(v => v.example)]
        }
        buttonsComponent.buttons.push(urlBtn)
      } else if (btn.type === 'PHONE_NUMBER') {
        buttonsComponent.buttons.push({
          type: 'PHONE_NUMBER',
          text: btn.text,
          phone_number: btn.phoneNumber,
        })
      } else if (btn.type === 'COPY_CODE') {
        buttonsComponent.buttons.push({
          type: 'COPY_CODE',
          example: btn.example,
        })
      } else if (btn.type === 'FLOW') {
        // Compiling FLOW button
        // Meta expects 'type: FLOW', 'text', 'flow_id', 'flow_action', 'navigate_screen'
        // This abstracts the actual details to the builder level.
        buttonsComponent.buttons.push({
          type: 'FLOW',
          text: btn.text,
          flow_id: btn.flow.flowId,
          flow_action: "navigate", // default action
          navigate_screen: "START", // default start screen
        })
      }
    })

    payload.components.push(buttonsComponent)
  }

  // Carousel Compilation
  if (template.carousel) {
    if (template.carousel.type === 'MEDIA') {
      const carouselComponent: any = {
        type: 'CAROUSEL',
        cards: []
      }
      
      template.carousel.cards.forEach(card => {
        const compiledCard: any = {
          components: []
        }
        
        // Card Header (Media)
        if (card.media) {
          const mediaComp: any = {
            type: 'HEADER',
            format: card.media.type,
          }
          if (card.media.mediaHandle) {
            mediaComp.example = { header_handle: [card.media.mediaHandle] }
          }
          compiledCard.components.push(mediaComp)
        }
        
        // Card Body
        if (card.body) {
          compiledCard.components.push({
            type: 'BODY',
            text: card.body
          })
        }
        
        // Card Buttons
        if (card.buttons && card.buttons.length > 0) {
           // We just push the buttons inside a BUTTONS component for the card
           const cardBtns = card.buttons.map(btn => {
              if (btn.type === 'QUICK_REPLY') return { type: 'QUICK_REPLY', text: btn.text }
              if (btn.type === 'URL') return { type: 'URL', text: btn.text, url: btn.url }
              return null
           }).filter(Boolean)
           
           if (cardBtns.length > 0) {
             compiledCard.components.push({ type: 'BUTTONS', buttons: cardBtns })
           }
        }
        
        carouselComponent.cards.push(compiledCard)
      })
      
      payload.components.push(carouselComponent)
    }
  }

  return payload
}
