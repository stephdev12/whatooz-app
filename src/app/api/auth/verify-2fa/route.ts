import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json()
    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    
    // Rechercher le code valide
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.error('Error verifying code:', error)
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    // Si on arrive ici, le code est bon. On le supprime pour éviter la réutilisation
    await supabase.from('verification_codes').delete().eq('id', data.id)

    return NextResponse.json({ success: true, message: 'Code verified successfully' })
  } catch (err: any) {
    console.error('verify-2fa error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
