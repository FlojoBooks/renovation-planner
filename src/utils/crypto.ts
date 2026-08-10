/**
 * Cryptografische utilities voor end-to-end wachtwoordhashing en invite link verificatie.
 * Maakt gebruik van de native Web Crypto API (werkt in alle moderne browsers & Node environments).
 */

/**
 * Converteert een ArrayBuffer naar een hexadecimale string.
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Genereert een cryptografisch veilige willekeurige salt van de opgegeven lengte.
 */
export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}

/**
 * Hasht een wachtwoord met een unieke salt met SHA-256.
 * Wachtwoorden worden NOOIT in plaintext opgeslagen.
 */
export async function hashPassword(password: string, existingSalt?: string): Promise<{ hash: string; salt: string }> {
  const salt = existingSalt || generateSalt();
  const encoder = new TextEncoder();
  
  // Combineer wachtwoord en salt
  const data = encoder.encode(password + ':' + salt + ':renovation_secret_salt');
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hash = bufferToHex(hashBuffer);

  return { hash, salt };
}

/**
 * Verifieert of een ingevoerd wachtwoord overeenkomt met de opgeslagen hash en salt.
 */
export async function verifyPassword(password: string, expectedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return hash === expectedHash;
}

// ── Private Invite Token Generator & Verifier ──────────────────

export interface InvitePayload {
  projectId?: string;
  role?: string;
  projectName?: string;
  createdAt: number;
  expiresAt: number;
  signature?: string;
}

const INVITE_SECRET = 'smikkelbakkies_invite_secret_key_2025';

/**
 * Genereert een beveiligde invite link token.
 */
export function generateInviteToken(payload: { role?: string; projectId?: string; projectName?: string; expiresInDays?: number }): string {
  const now = Date.now();
  const days = payload.expiresInDays || 14;
  const expiresAt = now + days * 24 * 60 * 60 * 1000;

  const data: InvitePayload = {
    projectId: payload.projectId || 'proj-001',
    role: payload.role || 'partner',
    projectName: payload.projectName || 'Project',
    createdAt: now,
    expiresAt,
  };

  const jsonStr = JSON.stringify(data);
  // Eenvoudige signature hash ter verificatie
  let checksum = 0;
  for (let i = 0; i < jsonStr.length; i++) {
    checksum = ((checksum << 5) - checksum + jsonStr.charCodeAt(i) + INVITE_SECRET.charCodeAt(i % INVITE_SECRET.length)) | 0;
  }
  data.signature = checksum.toString(36);

  const finalString = JSON.stringify(data);
  // Base64 encode voor URL safe transport
  return btoa(encodeURIComponent(finalString));
}

/**
 * Decodeert en verifieert een invite link token.
 */
export function verifyInviteToken(token: string): InvitePayload | null {
  try {
    const jsonStr = decodeURIComponent(atob(token));
    const data = JSON.parse(jsonStr) as InvitePayload;

    if (!data.signature || !data.expiresAt) return null;

    // Check expiry
    if (Date.now() > data.expiresAt) {
      console.warn('Invite token has expired');
      return null;
    }

    const checkCopy = { ...data };
    const givenSignature = checkCopy.signature;
    delete checkCopy.signature;

    const checkStr = JSON.stringify({
      projectId: checkCopy.projectId,
      role: checkCopy.role,
      projectName: checkCopy.projectName,
      createdAt: checkCopy.createdAt,
      expiresAt: checkCopy.expiresAt,
    });

    let checksum = 0;
    for (let i = 0; i < checkStr.length; i++) {
      checksum = ((checksum << 5) - checksum + checkStr.charCodeAt(i) + INVITE_SECRET.charCodeAt(i % INVITE_SECRET.length)) | 0;
    }

    if (checksum.toString(36) !== givenSignature) {
      console.warn('Invalid signature on invite token');
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error verifying invite token:', err);
    return null;
  }
}
