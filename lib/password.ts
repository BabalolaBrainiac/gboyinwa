// Password hashing using Web Crypto API - works in Node.js, Edge, and Browser
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;
const ITERATIONS = 100000;

function uint8ArrayToBase64(arr: Uint8Array): string {
  const chars: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    chars.push(String.fromCharCode(arr[i]!));
  }
  return btoa(chars.join(''));
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}

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
  
  return uint8ArrayToBase64(result);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const hashBytes = base64ToUint8Array(hash);
    
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
