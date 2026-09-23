import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WhatoozTemplate } from '@/lib/templates/types'
import { validateTemplate } from '@/lib/templates/validator'

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // A validate payload could be the template itself (without saving) 
    // or we fetch the current saved template
    const payload = await request.json() as WhatoozTemplate

    const validationResult = validateTemplate(payload)

    return NextResponse.json(validationResult)
  } catch (error: any) {
    console.error('Erreur Validation Templates:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
