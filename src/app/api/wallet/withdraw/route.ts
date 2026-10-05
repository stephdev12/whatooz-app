import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const orgId = req.headers.get('x-organization-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, method, phone } = await req.json()
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Check balance
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('id, available_balance, pending_balance')
      .eq('organization_id', orgId)
      .single()

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    if (wallet.available_balance < amount) {
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
    }

    // Deduct balance and create withdrawal record
    // In production, this should be done in a secure PostgreSQL transaction/RPC to avoid race conditions.
    const newBalance = wallet.available_balance - amount
    const newPending = (wallet.pending_balance || 0) + amount

    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({ 
        available_balance: newBalance, 
        pending_balance: newPending,
        updated_at: new Date().toISOString() 
      })
      .eq('id', wallet.id)

    if (updateError) {
      throw updateError
    }

    const { data: withdrawalData, error: insertError } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        organization_id: orgId,
        wallet_id: wallet.id,
        amount: amount,
        provider: 'saspay', // Assuming provider mapped to SasPay
        destination_phone: phone || undefined, // use phone from request
        status: 'PENDING'
      })
      .select()
      .single()

    if (insertError) {
      // Rollback would be needed here in a real scenario if not using RPC
      console.error(insertError)
      throw insertError
    }

    // Insert to wallet_transactions
    await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'WITHDRAWAL',
        amount: amount,
        direction: 'DEBIT',
        reference_type: 'withdrawal',
        reference_id: withdrawalData.id,
        balance_before: wallet.available_balance,
        balance_after: newBalance,
        status: 'COMPLETED'
      })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
