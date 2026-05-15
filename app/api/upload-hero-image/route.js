import { getServiceClient } from '../../../lib/supabase-admin'

const BUCKET = 'salon-hero-images'
const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const EXT_FOR_TYPE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export async function POST(req) {
  try {
    const form = await req.formData()
    const file = form.get('file')

    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No file provided.' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json({ error: 'Only JPG, PNG, or WebP images are allowed.' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'Image must be 8 MB or smaller.' }, { status: 400 })
    }

    const ext = EXT_FOR_TYPE[file.type] || 'jpg'
    const id = crypto.randomUUID()
    const path = `${id}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const supabase = getServiceClient()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      return Response.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return Response.json({ url: publicUrl, path })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
