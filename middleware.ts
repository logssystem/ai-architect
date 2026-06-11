import { NextRequest, NextResponse } from 'next/server'

// Protege /dashboard verificando o cookie de sessão do better-auth.
// A validação completa da sessão ocorre nos server components do layout.
export function middleware(req: NextRequest) {
  const sessionToken =
    req.cookies.get('better-auth.session_token')?.value ??
    req.cookies.get('__Secure-better-auth.session_token')?.value

  if (!sessionToken) {
    const url = req.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
