import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Veuillez vous connecter pour rejoindre une organisation.' }, { status: 401 })
    }

    const body = await request.json()
    const { access_code } = body

    if (!access_code || typeof access_code !== 'string') {
      return NextResponse.json({ error: 'Code d\'accès requis.' }, { status: 400 })
    }

    const cleanCode = access_code.trim().toUpperCase()

    // Find the organization with this code
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, slug')
      .eq('access_code', cleanCode)
      .maybeSingle()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Code d\'accès invalide ou introuvable.' }, { status: 404 })
    }

    // Check if the user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', org.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json({
        message: 'Vous êtes déjà membre de cette organisation.',
        organization: org,
        role: existingMember.role,
      })
    }

    // Add user as AGENT (Operator) by default
    const { error: insertError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'AGENT',
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Vous avez rejoint avec succès ${org.name} !`,
      organization: org,
      role: 'AGENT',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
