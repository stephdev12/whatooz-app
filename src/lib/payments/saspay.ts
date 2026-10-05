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
  static getConfig(): SasPayConfig {
    const apiKey = process.env.SASPAY_API_KEY
    const secretKey = process.env.SASPAY_SECRET_KEY
    const merchantId = process.env.SASPAY_MERCHANT_ID

    if (!apiKey) {
      console.warn('Missing SasPay credentials in environment variables.')
    }

    return {
      organizationId: 'SYSTEM',
      apiKey: apiKey || 'mock_api_key',
      secretKey: secretKey || 'mock_secret_key',
      merchantId: merchantId || 'mock_merchant_id'
    }
  }

  /**
   * Create a new payment session on SasPay and register the transaction in Whatooz.
   */
  static async createPayment(params: CreatePaymentParams): Promise<PaymentTransactionResult> {
    const config = this.getConfig()
    
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
    const successUrl = params.successUrl || `${baseUrl}/payment/success`

    const payload = {
      amount: params.amount.toString(),
      currency: params.currency || 'XOF',
      description: params.description || `Commande Whatooz ${params.orderId}`,
      customer_email: 'client@whatooz.com', // Required by SasPay API
      customer_name: params.customerPhone || 'Client Whatooz', // Required by SasPay API
      customer_phone: params.customerPhone,
      return_url: successUrl,
      metadata: {
        transaction_id: localTransactionId,
        order_id: params.orderId
      }
    }

    try {
      const response = await fetch('https://api.saspay.me/api/v1/checkout-sessions/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (!response.ok) {
        const errorDetail = data.error?.detail || data.message || JSON.stringify(data)
        throw new Error(`SasPay Error (${response.status}): ${errorDetail}`)
      }

      const providerTransactionId = data.id
      const paymentLink = data.checkout_url

      if (!providerTransactionId || !paymentLink) {
         throw new Error(`Invalid response from SasPay API. Received: ${JSON.stringify(data)}`)
      }

      // Update transaction with provider ID and payment link
      await supabaseAdmin
        .from('payment_transactions')
        .update({
          provider_transaction_id: providerTransactionId,
          payment_link: paymentLink
        })
        .eq('id', localTransactionId)

      return {
        transactionId: localTransactionId,
        paymentLink: paymentLink,
        status: 'pending'
      }
    } catch (error: any) {
      // Mark local transaction as failed if the API call fails
      await supabaseAdmin
        .from('payment_transactions')
        .update({ status: 'failed' })
        .eq('id', localTransactionId)

      throw new Error(`SasPay integration error: ${error.message}`)
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

    const config = this.getConfig()

    try {
      const response = await fetch(`https://api.saspay.me/api/v1/checkout-sessions/${tx.provider_transaction_id}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch checkout session status')
      }

      const data = await response.json()
      const saspayStatus = data.status?.toUpperCase()

      let internalStatus = 'pending'
      if (saspayStatus === 'SUCCESS' || saspayStatus === 'COMPLETED' || saspayStatus === 'PAID') {
        internalStatus = 'paid'
      } else if (saspayStatus === 'FAILED' || saspayStatus === 'CANCELLED') {
        internalStatus = 'failed'
      }

      // Update local status if changed
      await supabaseAdmin
        .from('payment_transactions')
        .update({ status: internalStatus })
        .eq('id', transactionId)

      return internalStatus
    } catch (error: any) {
      console.error(`[SasPayService] Error checking status: ${error.message}`)
      return 'pending' // Default to pending on error
    }
  }

  /**
   * Payout / Transfer money via SasPay (for withdrawals)
   */
  static async payout(amount: number, phone: string, network: string, referenceId: string): Promise<{ success: boolean, transactionId?: string, error?: string }> {
    const config = this.getConfig()
    
    // MOCK: SasPay Payout API
    console.log(`[SasPayService] Executing payout: ${amount} XOF to ${phone} via ${network}. Ref: ${referenceId}`)
    
    // Simulate a successful payout with a mock ID
    const mockProviderTransactionId = `PO-${Math.floor(Math.random() * 100000000)}`
    
    return {
      success: true,
      transactionId: mockProviderTransactionId
    }
  }
}
