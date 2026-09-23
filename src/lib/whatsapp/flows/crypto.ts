import crypto from 'crypto';

/**
 * Utility class for decrypting and encrypting WhatsApp Flows Data Exchange requests.
 * Conforms to Meta's technical documentation for Flow Endpoints.
 */
export class FlowCrypto {

  /**
   * Decrypts an incoming payload from WhatsApp Meta.
   * @param encryptedAesKey The AES key encrypted with the organization's RSA public key (base64)
   * @param encryptedIv The Initialization Vector (base64)
   * @param encryptedPayload The AES encrypted payload (base64)
   * @param privateKeyPem The organization's RSA private key (PEM format)
   * @returns The decrypted JSON object
   */
  static decryptRequest(
    encryptedAesKey: string,
    encryptedIv: string,
    encryptedPayload: string,
    privateKeyPem: string
  ): { decryptedBody: any; aesKeyBuffer: Buffer; ivBuffer: Buffer } {
    try {
      // 1. Decrypt the AES key using our RSA private key (OAEP padding, SHA-256)
      const decryptedAesKey = crypto.privateDecrypt(
        {
          key: privateKeyPem,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(encryptedAesKey, 'base64')
      );

      const iv = Buffer.from(encryptedIv, 'base64');
      
      // AES GCM requires the last 16 bytes of the payload to be the auth tag
      const payloadBuffer = Buffer.from(encryptedPayload, 'base64');
      
      const tagLength = 16;
      if (payloadBuffer.length <= tagLength) {
        throw new Error("Payload is too short to contain auth tag");
      }
      
      const ciphertext = payloadBuffer.subarray(0, payloadBuffer.length - tagLength);
      const authTag = payloadBuffer.subarray(payloadBuffer.length - tagLength);

      // 3. Decrypt the payload
      const decipher = crypto.createDecipheriv('aes-256-gcm', decryptedAesKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertext, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return {
        decryptedBody: JSON.parse(decrypted),
        aesKeyBuffer: decryptedAesKey,
        ivBuffer: iv,
      };

    } catch (error: any) {
      console.error('[FlowCrypto] Decryption error:', error.message);
      throw new Error('Failed to decrypt WhatsApp request');
    }
  }

  /**
   * Encrypts the response payload to send back to WhatsApp.
   * @param responsePayload The JSON response object
   * @param aesKeyBuffer The decrypted AES key from the request
   * @param ivBuffer The flipped IV from the request
   * @returns Base64 string of the encrypted payload
   */
  static encryptResponse(responsePayload: any, aesKeyBuffer: Buffer, ivBuffer: Buffer): string {
    try {
      // 1. Flip the IV bits (Meta requirement: flipped IV for response)
      const flippedIv = Buffer.alloc(ivBuffer.length);
      for (let i = 0; i < ivBuffer.length; i++) {
        flippedIv[i] = ~ivBuffer[i];
      }

      const cipher = crypto.createCipheriv('aes-256-gcm', aesKeyBuffer, flippedIv);
      
      let encrypted = cipher.update(JSON.stringify(responsePayload), 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const authTag = cipher.getAuthTag();
      
      // 2. Append Auth Tag to ciphertext
      const finalPayload = Buffer.concat([encrypted, authTag]);

      return finalPayload.toString('base64');

    } catch (error: any) {
      console.error('[FlowCrypto] Encryption error:', error.message);
      throw new Error('Failed to encrypt WhatsApp response');
    }
  }

  /**
   * Generates a new RSA 2048-bit keypair for a Flow Endpoint.
   */
  static generateKeyPair(): { publicKey: string, privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }
}
