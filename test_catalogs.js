const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Load env
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function decrypt(encryptedHex) {
  const buf = Buffer.from(encryptedHex, 'hex')
  const iv = buf.subarray(0, 12)
  const authTag = buf.subarray(buf.length - 16)
  const ciphertext = buf.subarray(12, buf.length - 16)

  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(process.env.ENCRYPTION_KEY, 'hex'), iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(ciphertext, undefined, 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

async function testCatalogs() {
  const { data: configs } = await supabase.from('whatsapp_config').select('waba_id, access_token_encrypted').limit(1);
  if (!configs || configs.length === 0) return console.log('No config found');
  
  const config = configs[0];
  const accessToken = decrypt(config.access_token_encrypted);
  const wabaId = config.waba_id;
  
  console.log('WABA ID:', wabaId);
  
  // Check permissions
  const resPerms = await fetch(`https://graph.facebook.com/v20.0/me/permissions`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  console.log('GET /me/permissions:', JSON.stringify(await resPerms.json(), null, 2));

  // Check catalogs on WABA
  const res1 = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/product_catalogs`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  console.log('GET /WABA/product_catalogs:', JSON.stringify(await res1.json(), null, 2));
}

testCatalogs();
