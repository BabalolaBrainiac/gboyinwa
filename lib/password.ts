// Password hashing using Web Crypto API - works in Node.js, Edge, and Browser
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;
const ITERATIONS = 100000;

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const passwordData = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_LENGTH * 8
  );
  
  const hashArray = new Uint8Array(hash);
  const result = new Uint8Array(SALT_LENGTH + HASH_LENGTH);
  result.set(salt);
  result.set(hashArray, SALT_LENGTH);
  
  return btoa(String.fromCharCode(...result));
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const hashBytes = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
    
    const salt = hashBytes.slice(0, SALT_LENGTH);
    const originalHash = hashBytes.slice(SALT_LENGTH);
    
    const passwordData = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const newHash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      HASH_LENGTH * 8
    );
    
    const newHashArray = new Uint8Array(newHash);
    
    // Constant-time comparison
    if (originalHash.length !== newHashArray.length) return false;
    let result = 0;
    for (let i = 0; i < originalHash.length; i++) {
      result |= originalHash[i]! ^ newHashArray[i]!;
    }
    return result === 0;
  } catch {
    return false;
  }
}
