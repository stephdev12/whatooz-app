import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WhatoozTemplate } from '@/lib/templates/types'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID requis' }, { status: 400 })
    }

    // Verify membership
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()
      
    if (!member) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { data: templates, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(templates)
  } catch (error: any) {
    console.error('Erreur API Templates:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const payload = await request.json() as Partial<WhatoozTemplate>
    
    if (!payload.organization_id || !payload.name || !payload.language || !payload.category) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // Insert as DRAFT
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .insert({
        organization_id: payload.organization_id,
        name: payload.name,
        category: payload.category,
        language: payload.language,
        status: 'DRAFT',
        definition_json: payload, // Store the entire Whatooz object in definition_json
      })
      .select()
      .single()

    if (error) {
      // Handle unique constraint on (organization_id, name, language)
      if (error.code === '23505') {
         return NextResponse.json({ error: 'Un template avec ce nom et cette langue existe déjà' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Erreur POST Templates:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
