const VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

const CONFIG_ERRORS = ['invalid-input-secret', 'missing-input-secret']

export type TurnstileResult = {
  success: boolean
  errorCodes: string[]
  misconfigured: boolean
}

type VerifyResponse = { success?: boolean; 'error-codes'?: string[] }

export async function verifyTurnstile(
  token: string,
  secret: string,
  ip: string | null
): Promise<TurnstileResult> {
  const body = new FormData()
  body.append('secret', secret)
  body.append('response', token)
  if (ip) body.append('remoteip', ip)

  const res = await fetch(VERIFY, { method: 'POST', body })

  let data: VerifyResponse
  try {
    data = await res.json()
  } catch {
    return { success: false, errorCodes: ['siteverify-unreachable'], misconfigured: false }
  }

  const errorCodes = data['error-codes'] ?? []

  return {
    success: data.success === true,
    errorCodes,
    misconfigured: errorCodes.some((code) => CONFIG_ERRORS.includes(code)),
  }
}
