const enc = new TextEncoder()

function toBase64Url(bytes: ArrayBuffer): string {
  const b = String.fromCharCode(...new Uint8Array(bytes))
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(b, (ch) => ch.charCodeAt(0))
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function sign(value: string, secret: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(value))
  return `${value}.${toBase64Url(sig)}`
}

export async function unsign(signed: string, secret: string): Promise<string | null> {
  const i = signed.lastIndexOf('.')
  if (i <= 0) return null
  const value = signed.slice(0, i)
  let sig: Uint8Array
  try {
    sig = fromBase64Url(signed.slice(i + 1))
  } catch {
    return null
  }
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), sig as unknown as BufferSource, enc.encode(value))
  return ok ? value : null
}
