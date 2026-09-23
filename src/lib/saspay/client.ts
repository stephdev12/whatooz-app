export interface SasPayPaymentRequest {
  merchant_id: string
  amount: number
  currency: string
  order_id: string
  description?: string
  return_url: string
  cancel_url: string
  webhook_url: string
}

export interface SasPayPaymentResponse {
  payment_url: string
  transaction_id: string
  status: string
}

/**
 * Creates a SasPay checkout session/payment link.
 */
export async function createSasPayPayment(
  credentials: { apiKey: string; secretKey: string },
  request: SasPayPaymentRequest
): Promise<SasPayPaymentResponse> {
  const url = 'https://api.saspay.com/v1/payments'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': credentials.apiKey,
      'X-Secret-Key': credentials.secretKey,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`SasPay API error: ${response.status} - ${err}`)
  }

  return response.json()
}
