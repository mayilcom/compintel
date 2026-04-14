import { createServiceClient } from '@/lib/supabase/server'
import { LookupManager } from '@/components/admin/lookup-manager'
import type { BrandLookupRow } from '@/components/admin/lookup-manager'

export const metadata = { title: 'Brand Lookup — Admin' }

export default async function AdminLookupPage() {
  const db = createServiceClient()

  const { data, error } = await db
    .from('brand_lookup')
    .select('*')
    .order('brand_name', { ascending: true })

  if (error) throw error

  return <LookupManager initialBrands={(data ?? []) as BrandLookupRow[]} />
}
