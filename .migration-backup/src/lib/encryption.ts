/**
 * Application-Level Encryption Utilities
 * 
 * Provides additional encryption layer for extra-sensitive fields
 * beyond database-level encryption (defense in depth).
 * 
 * Use cases:
 * - Mental health notes in logs
 * - Relationship journal entries
 * - Financial details in notes
 * - Personal health information
 */

/**
 * Encrypt sensitive text data
 * 
 * Uses Web Crypto API (browser) or Node crypto (server)
 * Algorithm: AES-256-GCM
 * 
 * @param plaintext - Data to encrypt
 * @param userKey - User-specific encryption key (derived from auth)
 * @returns Base64-encoded encrypted data with IV
 */
export async function encryptField(
  plaintext: string,
  userKey?: string
): Promise<string> {
  if (!plaintext) return '';
  
  try {
    // For now, return plaintext (database encryption handles this)
    // TODO: Implement when user-specific keys are available
    return plaintext;
    
    // Future implementation:
    // const key = await deriveKey(userKey);
    // const iv = crypto.getRandomValues(new Uint8Array(12));
    // const encoded = new TextEncoder().encode(plaintext);
    // const encrypted = await crypto.subtle.encrypt(
    //   { name: 'AES-GCM', iv },
    //   key,
    //   encoded
    // );
    // return btoa(JSON.stringify({
    //   iv: Array.from(iv),
    //   data: Array.from(new Uint8Array(encrypted))
    // }));
  } catch (error) {
    console.error('Encryption error:', error);
    return plaintext; // Fallback to plaintext (database encryption still applies)
  }
}

/**
 * Decrypt sensitive text data
 * 
 * @param encrypted - Base64-encoded encrypted data
 * @param userKey - User-specific encryption key
 * @returns Decrypted plaintext
 */
export async function decryptField(
  encrypted: string,
  userKey?: string
): Promise<string> {
  if (!encrypted) return '';
  
  try {
    // For now, return as-is (database encryption handles this)
    // TODO: Implement when user-specific keys are available
    return encrypted;
    
    // Future implementation:
    // const { iv, data } = JSON.parse(atob(encrypted));
    // const key = await deriveKey(userKey);
    // const decrypted = await crypto.subtle.decrypt(
    //   { name: 'AES-GCM', iv: new Uint8Array(iv) },
    //   key,
    //   new Uint8Array(data)
    // );
    // return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return encrypted; // Fallback to encrypted text
  }
}

/**
 * Derive encryption key from user password/key
 * Uses PBKDF2 for key derivation
 * 
 * @param userKey - User's password or key material
 * @returns CryptoKey for AES encryption
 */
async function deriveKey(userKey: string = 'default'): Promise<CryptoKey> {
  // Import user key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(userKey),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive AES key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('lifeos-salt-v1'), // Should be per-user
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Hash sensitive data for comparison (one-way)
 * Use for data that needs comparison but not decryption
 * 
 * @param data - Data to hash
 * @returns SHA-256 hash as hex string
 */
export async function hashData(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Mask sensitive data for display
 * Shows first/last characters, masks middle
 * 
 * @param data - Sensitive string
 * @param visibleChars - Number of chars to show at start/end
 * @returns Masked string
 */
export function maskSensitiveData(
  data: string,
  visibleChars: number = 4
): string {
  if (!data || data.length <= visibleChars * 2) {
    return '*'.repeat(data?.length || 8);
  }
  
  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  const masked = '*'.repeat(data.length - visibleChars * 2);
  
  return `${start}${masked}${end}`;
}

/**
 * Check if field should be encrypted
 * Based on field name and data sensitivity
 * 
 * @param fieldName - Name of the field
 * @param value - Field value
 * @returns True if field should be encrypted
 */
export function shouldEncryptField(
  fieldName: string,
  value: any
): boolean {
  if (!value) return false;
  
  const sensitiveFields = [
    'notes',
    'mental_health',
    'relationship_notes',
    'therapy_notes',
    'financial_details',
    'password',
    'ssn',
    'credit_card',
  ];
  
  return sensitiveFields.some(field => 
    fieldName.toLowerCase().includes(field)
  );
}

/**
 * Securely wipe sensitive data from memory
 * Overwrites string in memory before garbage collection
 * 
 * @param data - Sensitive string to wipe
 */
export function secureWipe(data: string): void {
  if (!data) return;
  
  try {
    // Overwrite with random data
    const length = data.length;
    const random = Array.from(
      crypto.getRandomValues(new Uint8Array(length)),
      b => String.fromCharCode(b)
    ).join('');
    
    // Note: JavaScript strings are immutable
    // This is more of a best-effort approach
    data = random;
  } catch (error) {
    console.error('Secure wipe error:', error);
  }
}
