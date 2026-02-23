import { createServiceRoleClient, createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient()
  
  // Verify user is authenticated
  const supabaseUser = createServerSupabaseClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user && process.env.DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) return NextResponse.json({ error: 'Fajl nije pronađen' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Dozvoljeni formati: JPEG, PNG, WebP' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Maksimalna veličina fajla je 10MB' }, { status: 400 })
  }

  // Handle Demo Mode user ID
  const userId = user?.id ?? '00000000-0000-0000-0000-000000000001'

  const fileExt = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
  const bytes = await file.arrayBuffer()

  const { data, error } = await supabase.storage
    .from('listing-images')
    .upload(fileName, bytes, {
      contentType: file.type,
      upsert: false,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('listing-images')
    .getPublicUrl(data.path)

  // Supabase Image Transform API for variants
  return NextResponse.json({
    id: data.path,
    url: publicUrl,
    originalUrl: publicUrl,
    mediumUrl: `${publicUrl}?width=800&quality=80`,
    thumbUrl: `${publicUrl}?width=400&height=400&resize=cover&quality=70`,
  })
}
