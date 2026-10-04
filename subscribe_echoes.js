// Quick script to re-subscribe WABA to webhooks with smb_message_echoes
const crypto = require('crypto');

const SUPABASE_URL = 'https://kruihigufllffcrnfwai.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydWloaWd1ZmxsZmZjcm5md2FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTgwNzM4MSwiZXhwIjoyMTA1MzgzMzgxfQ.4D2foWCNpgFAbLjRIrSv7--C2uQ0gu4rtcRPhEHv72Y';
const ENCRYPTION_KEY = '828846aa8852e83dff9f435abe551d2fb42f69e67ea3f5c7efeebc200067fcd1';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function decrypt(ciphertextHex) {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const data = Buffer.from(ciphertextHex, 'hex');
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(data.length - AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH, data.length - AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

async function main() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_config?select=waba_id,access_token_encrypted,organization_id`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    }
  });
  const configs = await res.json();
  console.log('Found configs:', configs.length);
  
  for (const config of configs) {
    console.log(`\nProcessing WABA: ${config.waba_id} (org: ${config.organization_id})`);
    
    if (!config.access_token_encrypted) {
      console.log('  No encrypted token, skipping');
      continue;
    }
    
    try {
      const accessToken = decrypt(config.access_token_encrypted);
      console.log('  Token decrypted OK (length:', accessToken.length, ')');
      
      // Subscribe with smb_message_echoes
      console.log('  Subscribing to messages + smb_message_echoes...');
      const subRes = await fetch(`https://graph.facebook.com/v20.0/${config.waba_id}/subscribed_apps`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'subscribed_fields=messages,smb_message_echoes',
      });
      
      const subData = await subRes.json();
      
      if (!subRes.ok) {
        console.error('  ❌ Subscription failed:', JSON.stringify(subData));
      } else {
        console.log('  ✅ Subscribed!', JSON.stringify(subData));
      }
      
      // Verify
      const verifyRes = await fetch(`https://graph.facebook.com/v20.0/${config.waba_id}/subscribed_apps`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const verifyData = await verifyRes.json();
      console.log('  Current subscriptions:', JSON.stringify(verifyData, null, 2));
      
    } catch (err) {
      console.error('  Error:', err.message);
    }
  }
}

main().catch(console.error);
