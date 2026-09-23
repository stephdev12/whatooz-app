import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const orgId = req.headers.get('x-organization-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, method } = await req.json()
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Check balance
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('organization_id', orgId)
      .single()

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    if (wallet.balance < amount) {
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
    }

    // Deduct balance and create withdrawal record
    // In production, this should be done in a secure PostgreSQL transaction/RPC to avoid race conditions.
    const newBalance = wallet.balance - amount

    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id)

    if (updateError) {
      throw updateError
    }

    const { error: insertError } = await supabaseAdmin
      .from('wallet_withdrawals')
      .insert({
        wallet_id: wallet.id,
        amount: amount,
        withdrawal_method: method || 'Bank Transfer',
        status: 'PENDING'
      })

    if (insertError) {
      // Rollback would be needed here in a real scenario if not using RPC
      console.error(insertError)
      throw insertError
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
