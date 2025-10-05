// This utility uses the Web Crypto API, which is available in Cloudflare Workers.
// It replaces bcryptjs, which relies on Node.js crypto module and causes runtime errors.
// Function to convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
// Function to hash a password with a salt.
// We are not using a salt for simplicity in this implementation to avoid storing it,
// but a production system should generate and store a unique salt for each user.
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}
// Function to verify a password against a hash.
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}