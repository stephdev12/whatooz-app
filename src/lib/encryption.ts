import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''
const ALGORITHM = 'aes-256-gcm'

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.warn('ENCRYPTION_KEY is not set correctly or is not 64 hex characters. Encryption may fail.')
}

/**
 * Decrypts a previously encrypted token using AES-256-GCM
 * @param encryptedText The encrypted text (format: iv:authTag:encryptedData)
 * @returns The decrypted original text
 */
export function decryptToken(encryptedText: string): string {
  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'hex')
    const parts = encryptedText.split(':')
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format. Expected iv:authTag:encryptedData')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encryptedData = Buffer.from(parts[2], 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedData, undefined, 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt token')
  }
}

/**
 * Encrypts a plain text token using AES-256-GCM
 * @param text The plain text to encrypt
 * @returns The encrypted string in format iv:authTag:encryptedData
 */
export function encryptToken(text: string): string {
  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'hex')
    const iv = crypto.randomBytes(12) // GCM standard IV length is 12 bytes
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag().toString('hex')
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt token')
  }
}
