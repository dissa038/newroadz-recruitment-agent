'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()

  // Routes that should not show navbar/footer (public auth pages)
  const publicRoutes = ['/login', '/auth/callback', '/auth/confirm', '/auth/auth-code-error']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    // For public routes (like login), render children without navbar/footer
    return <>{children}</>
  }

  // For protected routes, render with navbar and footer
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}