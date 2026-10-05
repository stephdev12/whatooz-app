require('dotenv').config({ path: '.env.local' });

async function testWebhook() {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'WHATEVER',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '1234', phone_number_id: '123456789' },
          contacts: [{ profile: { name: 'Test User' }, wa_id: '237698711207' }],
          messages: [{
            from: '237698711207',
            id: 'wamid.HBgMMjM3Njk4NzExMjA3FQIAEhggQTVFMTQxQUVDMjJBMjlCMkY1Mjk1QkNCQTk1RTJEODQA_TEST2',
            timestamp: Math.floor(Date.now() / 1000).toString(),
            text: { body: 'Je veux voir le casque' },
            type: 'text'
          }]
        },
        field: 'messages'
      }]
    }]
  };

  const res = await fetch('http://localhost:3000/api/whatsapp/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}

testWebhook();
