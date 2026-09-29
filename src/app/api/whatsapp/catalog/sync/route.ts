import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/whatsapp/encryption'
import { getCatalogs, getProducts } from '@/lib/whatsapp/commerce'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 1. Check Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'ID de l\'organisation manquant' }, { status: 400 })
    }

    // 2. Ensure user has access to organization
    const { data: orgAccess } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (!orgAccess) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // 3. Get WhatsApp Config
    const { data: config, error: configError } = await supabaseAdmin
      .from('whatsapp_config')
      .select('waba_id, access_token_encrypted')
      .eq('organization_id', organizationId)
      .single()

    if (configError || !config) {
      return NextResponse.json({ error: 'WhatsApp non configuré pour cette organisation' }, { status: 404 })
    }

    const accessToken = decrypt(config.access_token_encrypted)

    // 4. Fetch Catalogs from Meta
    const metaCatalogs = await getCatalogs({
      wabaId: config.waba_id,
      accessToken,
    })

    if (!metaCatalogs || metaCatalogs.length === 0) {
      return NextResponse.json({ message: 'Aucun catalogue trouvé sur ce compte WhatsApp Business.' })
    }

    const syncedCatalogs = []

    // 5. Sync each catalog and its products
    for (const catalog of metaCatalogs) {
      // Upsert Catalog
      const { data: savedCatalog, error: catalogSaveError } = await supabaseAdmin
        .from('meta_catalogs')
        .upsert({
          organization_id: organizationId,
          meta_catalog_id: catalog.id,
          name: catalog.name,
          vertical: catalog.vertical,
          last_synced_at: new Date().toISOString()
        }, { onConflict: 'organization_id, meta_catalog_id' })
        .select()
        .single()

      if (catalogSaveError || !savedCatalog) {
        console.error('Erreur sauvegarde catalogue', catalogSaveError)
        continue
      }

      syncedCatalogs.push(savedCatalog)

      // Fetch Products
      const products = await getProducts({
        catalogId: catalog.id,
        accessToken
      })

      // Upsert Products
      for (const product of products) {
        await supabaseAdmin
          .from('meta_catalog_products')
          .upsert({
            organization_id: organizationId,
            catalog_id: savedCatalog.id,
            meta_product_id: product.id,
            retailer_id: product.retailer_id,
            name: product.name,
            description: product.description,
            price: product.price ? parseFloat(product.price) : 0,
            currency: product.currency,
            image_url: product.image_url,
            availability: product.availability,
            url: product.url,
            raw_data: product,
            last_synced_at: new Date().toISOString()
          }, { onConflict: 'catalog_id, retailer_id' })
      }
    }

    return NextResponse.json({ success: true, catalogs: syncedCatalogs })

  } catch (error: any) {
    console.error('[CATALOG SYNC ERROR]', error)
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 })
  }
}
