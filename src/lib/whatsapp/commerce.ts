import { META_API_BASE } from './config'
import { throwMetaError } from './meta-api'

export interface MetaCatalog {
  id: string
  name: string
  vertical: string
  product_count?: number
}

export interface MetaProduct {
  id: string
  retailer_id: string
  name: string
  description: string
  price: string
  currency: string
  image_url: string
  availability: string
  url: string
}

/**
 * Retrieves the catalogs owned by the business.
 */
export async function getCatalogs(args: {
  businessId: string
  accessToken: string
}): Promise<MetaCatalog[]> {
  const { businessId, accessToken } = args
  const url = `${META_API_BASE}/${businessId}/owned_product_catalogs?fields=id,name,vertical,product_count`
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  
  if (!response.ok) {
    await throwMetaError(response, 'Failed to fetch catalogs from Meta')
  }
  
  const data = await response.json()
  return data.data || []
}

/**
 * Retrieves products for a specific catalog.
 */
export async function getProducts(args: {
  catalogId: string
  accessToken: string
  limit?: number
}): Promise<MetaProduct[]> {
  const { catalogId, accessToken, limit = 100 } = args
  const url = `${META_API_BASE}/${catalogId}/products?fields=id,retailer_id,name,description,price,currency,image_url,availability,url&limit=${limit}`
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  
  if (!response.ok) {
    await throwMetaError(response, 'Failed to fetch products from Meta')
  }
  
  const data = await response.json()
  return data.data || []
}
