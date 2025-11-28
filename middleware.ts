import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes publiques (accessibles sans authentification)
const publicRoutes = ['/login']

// Routes protégées (nécessitent authentification)
const protectedRoutes = ['/dashboard']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Vérifier si la route est protégée
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Récupérer le token depuis les cookies Supabase
  // Supabase utilise plusieurs cookies, cherchons-les tous
  const supabaseAuthToken = request.cookies.get('sb-access-token')?.value ||
                           request.cookies.get('supabase-auth-token')?.value ||
                           request.cookies.getAll().find(cookie => 
                             cookie.name.includes('sb-') && cookie.name.includes('auth-token')
                           )?.value
  
  // Pour le développement, on laisse passer si on ne trouve pas de cookie
  // L'AuthContext gérera la vérification côté client
  if (isProtectedRoute && !supabaseAuthToken) {
    // En développement, laisser passer et laisser AuthContext gérer
    // Le middleware Next.js Edge ne peut pas accéder à Supabase facilement
    console.log('Middleware: Pas de token trouvé, mais on laisse passer pour AuthContext')
  }
  
  // Ajouter des headers de sécurité supplémentaires
  const response = NextResponse.next()
  
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  
  return response
}

// Configuration du matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
