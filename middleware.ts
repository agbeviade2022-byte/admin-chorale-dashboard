import { NextResponse, type NextRequest } from 'next/server'

// Middleware SIMPLE - pas de vérification auth côté serveur
// L'auth est gérée côté client par AuthContext
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Headers de sécurité seulement
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
