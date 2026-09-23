import { WhatoozTemplate, ValidationResult } from './types'

export function validateTemplate(template: WhatoozTemplate): ValidationResult {
  const errors: ValidationResult['errors'] = []
  const warnings: ValidationResult['warnings'] = []

  // Basic info validation
  if (!template.name || !/^[a-z0-9_]+$/.test(template.name)) {
    errors.push({
      path: 'name',
      message: "Le nom du template ne doit contenir que des lettres minuscules, chiffres et underscores (_)",
    })
  }
  if (!template.category) {
    errors.push({ path: 'category', message: "La catégorie est requise" })
  }
  if (!template.language) {
    errors.push({ path: 'language', message: "La langue est requise" })
  }

  // Body validation
  if (!template.body || !template.body.text || template.body.text.trim() === '') {
    errors.push({ path: 'body.text', message: "Le contenu du message (Body) est requis" })
  } else if (template.body.text.length > 1024) {
    errors.push({ path: 'body.text', message: "Le contenu du message ne doit pas dépasser 1024 caractères" })
  }

  // Variables validation
  const positionalMatches = template.body?.text?.match(/\{\{\d+\}\}/g) || []
  const namedMatches = template.body?.text?.match(/\{\{[a-zA-Z_]+\}\}/g) || []

  if (positionalMatches.length > 0 && namedMatches.length > 0) {
    errors.push({ path: 'body.text', message: "Vous ne pouvez pas mélanger les variables positionnelles ({{1}}) et nommées ({{nom}})" })
  }

  const variables = template.body?.variables || []
  if (positionalMatches.length > 0) {
    // Check if we have examples for each
    const requiredPositions = Array.from(new Set(positionalMatches.map(m => parseInt(m.replace(/[{}]/g, '')))))
    for (const pos of requiredPositions) {
      if (!variables.find(v => v.position === pos && v.example)) {
        errors.push({ path: `body.variables`, message: `L'exemple est manquant pour la variable {{${pos}}}` })
      }
    }
  }

  // Footer validation
  if (template.footer?.text && template.footer.text.length > 60) {
    errors.push({ path: 'footer.text', message: "Le bas de page (Footer) ne doit pas dépasser 60 caractères" })
  }

  // Buttons validation
  if (template.buttons && template.buttons.length > 0) {
    if (template.buttons.length > 10) {
      errors.push({ path: 'buttons', message: "Un maximum de 10 boutons est autorisé" })
    }
    
    let quickReplyCount = 0
    let urlCount = 0
    let phoneCount = 0
    let copyCodeCount = 0
    let flowCount = 0

    template.buttons.forEach((btn, index) => {
      switch (btn.type) {
        case 'QUICK_REPLY':
          quickReplyCount++
          if (!btn.text || btn.text.length > 25) {
            errors.push({ path: `buttons[${index}]`, message: "Le texte de la réponse rapide ne doit pas dépasser 25 caractères" })
          }
          break
        case 'URL':
          urlCount++
          if (!btn.text || !btn.url) {
            errors.push({ path: `buttons[${index}]`, message: "Le label et l'URL sont requis" })
          }
          break
        case 'PHONE_NUMBER':
          phoneCount++
          if (phoneCount > 1) {
            errors.push({ path: `buttons[${index}]`, message: "Un seul bouton d'appel est autorisé" })
          }
          break
        case 'COPY_CODE':
          copyCodeCount++
          if (copyCodeCount > 1) {
            errors.push({ path: `buttons[${index}]`, message: "Un seul bouton de copie est autorisé" })
          }
          break
        case 'FLOW':
          flowCount++
          break
      }
    })

    if (quickReplyCount > 0 && (urlCount > 0 || phoneCount > 0 || flowCount > 0)) {
       // Typically Meta allows mixing some button types in newer versions, but there are constraints. 
       // For a strict builder, we might warn instead of err.
       warnings.push({ path: 'buttons', message: "Vérifiez la compatibilité Meta pour ce mélange de boutons (certaines combinaisons peuvent être rejetées)" })
    }
  }

  // Header validation
  if (template.header && template.header.type !== 'NONE') {
    if (template.header.type === 'TEXT') {
      if (!template.header.text || template.header.text.length > 60) {
        errors.push({ path: 'header.text', message: "Le texte de l'en-tête ne doit pas dépasser 60 caractères" })
      }
    } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(template.header.type)) {
      if ((!('mediaHandle' in template.header) || !template.header.mediaHandle) && 
          (!('mediaId' in template.header) || !template.header.mediaId)) {
        warnings.push({ path: 'header.media', message: "Un média d'exemple doit être uploadé avant soumission." })
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
