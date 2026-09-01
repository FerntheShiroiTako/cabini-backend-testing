export const MAX_BYTES = 5 * 1024 * 1024

const SIGNATURES = [
  { mime: 'image/png', ext: 'png', test: (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: 'image/jpeg', ext: 'jpg', test: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/gif', ext: 'gif', test: (b: Uint8Array) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
  {
    mime: 'image/webp',
    ext: 'webp',
    test: (b: Uint8Array) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
]

export function detectImage(bytes: Uint8Array): { mime: string; ext: string } | null {
  if (bytes.length < 12) return null
  return SIGNATURES.find((s) => s.test(bytes)) ?? null
}
