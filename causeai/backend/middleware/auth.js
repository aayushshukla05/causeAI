import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    req.userId = null
    return next()
  }
  try {
    const token = header.split(' ')[1]
    const { data: { user } } = await supabase.auth.getUser(token)
    req.userId = user?.id || null
  } catch {
    req.userId = null
  }
  next()
}
