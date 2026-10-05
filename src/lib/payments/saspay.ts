import { supabaseAdmin } from '@/lib/supabase/admin'

export interface SasPayConfig {
  organizationId: string
  apiKey: string
  secretKey: string
  merchantId?: string
}

export interface CreatePaymentParams {
  organizationId: string
  orderId: string
  amount: number
  currency: string
  customerPhone: string
  description?: string
  successUrl?: string
  failUrl?: string
  webhookUrl?: string
}

export interface PaymentTransactionResult {
  transactionId: string
  paymentLink: string
  status: string
}

export class SasPayService {
  /**
   * Fetch SasPay credentials for a given organization.
   */
  static async getConfig(organizationId: string): Promise<SasPayConfig> {
    const { data, error } = await supabaseAdmin
      .from('saspay_credentials')
      .select('api_key, secret_key, merchant_id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) {
      throw new Error(`SasPay credentials not found or inactive for organization: ${organizationId}`)
    }

    return {
      organizationId,
      apiKey: data.api_key,
      secretKey: data.secret_key,
      merchantId: data.merchant_id
    }
  }

  /**
   * Create a new payment session on SasPay and register the transaction in Whatooz.
   */
  static async createPayment(params: CreatePaymentParams): Promise<PaymentTransactionResult> {
    const config = await this.getConfig(params.organizationId)
    
    // Create the transaction in Whatooz DB first as 'pending'
    const { data: tx, error: txError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        organization_id: params.organizationId,
        order_id: params.orderId,
        provider: 'saspay',
        amount: params.amount,
        currency: params.currency,
        status: 'pending',
        customer_phone: params.customerPhone
      })
      .select('id')
      .single()

    if (txError || !tx) {
      throw new Error(`Failed to create payment transaction record: ${txError?.message}`)
    }

    const localTransactionId = tx.id

    // Call SasPay API
    // Note: The following is a mock of the actual SasPay API call based on standard gateway patterns.
    // Replace with the exact SasPay API URL and payload schema.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.whatooz.com'
    const webhookUrl = params.webhookUrl || `${baseUrl}/api/webhooks/saspay`
    const successUrl = params.successUrl || `${baseUrl}/payment/success`
    const failUrl = params.failUrl || `${baseUrl}/payment/fail`

    const payload = {
      amount: params.amount,
      currency: params.currency,
      description: params.description || `Commande Whatooz ${params.orderId}`,
      customer_msisdn: params.customerPhone,
      transaction_id: localTransactionId, // Send our internal UUID as reference
      merchant_id: config.merchantId,
      return_url: successUrl,
      cancel_url: failUrl,
      notify_url: webhookUrl
    }

    // MOCK: In a real implementation, you will send a POST request to SasPay endpoint.
    // const response = await fetch('https://api.saspay.com/v1/checkout', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${config.apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(payload)
    // })
    // const data = await response.json()
    // if (!response.ok) throw new Error(data.message)

    // Mocking successful response
    const mockProviderTransactionId = `SP-${Math.floor(Math.random() * 100000000)}`
    const mockPaymentLink = `https://checkout.saspay.com/pay/${mockProviderTransactionId}`

    // Update transaction with provider ID and payment link
    await supabaseAdmin
      .from('payment_transactions')
      .update({
        provider_transaction_id: mockProviderTransactionId,
        payment_link: mockPaymentLink
      })
      .eq('id', localTransactionId)

    return {
      transactionId: localTransactionId,
      paymentLink: mockPaymentLink,
      status: 'pending'
    }
  }

  /**
   * Check payment status from SasPay
   */
  static async checkPaymentStatus(transactionId: string): Promise<string> {
    const { data: tx } = await supabaseAdmin
      .from('payment_transactions')
      .select('organization_id, provider_transaction_id')
      .eq('id', transactionId)
      .maybeSingle()

    if (!tx || !tx.provider_transaction_id) {
      throw new Error(`Transaction ${transactionId} not found or missing provider ID`)
    }

    const config = await this.getConfig(tx.organization_id)

    // Call SasPay API to check status
    // MOCK
    const mockStatus = 'paid' // 'pending', 'paid', 'failed'

    // Update local status if changed
    await supabaseAdmin
      .from('payment_transactions')
      .update({ status: mockStatus })
      .eq('id', transactionId)

    return mockStatus
  }
}
