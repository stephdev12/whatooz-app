const fs = require('fs');
const path = require('path');

const codeToAppend = `
export async function sendProductListMessage(args: {
  phoneNumberId: string
  accessToken: string
  to: string
  catalogId: string
  sections: Array<{ title: string, productRetailerIds: string[] }>
  headerText?: string
  bodyText: string
  footerText?: string
}): Promise<MetaSendResult> {
  const { phoneNumberId, accessToken, to, catalogId, sections, headerText, bodyText, footerText } = args
  const url = \`\${META_API_BASE}/\${phoneNumberId}/messages\`

  const formattedSections = sections.map(sec => ({
    title: sec.title.substring(0, 24),
    product_items: sec.productRetailerIds.map(id => ({ product_retailer_id: id }))
  }))

  const interactive: any = {
    type: 'product_list',
    header: headerText ? { type: 'text', text: headerText } : { type: 'text', text: 'Notre Sélection' },
    body: { text: bodyText },
    action: {
      catalog_id: catalogId,
      sections: formattedSections
    }
  }
  if (footerText) interactive.footer = { text: footerText }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'interactive',
      interactive
    })
  })

  const data = await response.json()
  if (!response.ok) {
    console.error('[Meta API Error HTTP ' + response.status + ']', JSON.stringify(data, null, 2))
    throw new Error(data.error?.message || 'Failed to send product list message')
  }

  return { messageId: data.messages?.[0]?.id ?? '' }
}
`;

const filePath = path.join(__dirname, 'src', 'lib', 'whatsapp', 'meta-api.ts');
fs.appendFileSync(filePath, codeToAppend);
console.log("Appended sendProductListMessage");
