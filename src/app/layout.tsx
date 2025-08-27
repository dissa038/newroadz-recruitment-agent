import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { AuthGuard } from "@/components/AuthGuard";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: {
    default: "Newroadz Recruitment Agent",
    template: "%s | Newroadz Recruitment Agent"
  },
  description: "AI-powered recruitment platform for sourcing and managing candidates. Find the perfect talent with advanced search, automated screening, and intelligent matching.",
  keywords: ["recruitment", "AI", "candidates", "HR", "talent acquisition", "sourcing", "hiring"],
  authors: [{ name: "Newroadz" }],
  creator: "Newroadz",
  publisher: "Newroadz",
  metadataBase: new URL('https://recruitment.newroadz.com'),
  openGraph: {
    title: "Newroadz Recruitment Agent",
    description: "AI-powered recruitment platform for sourcing and managing candidates",
    url: "https://recruitment.newroadz.com",
    siteName: "Newroadz Recruitment Agent",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Newroadz Recruitment Agent",
    description: "AI-powered recruitment platform for sourcing and managing candidates",
    creator: "@newroadz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Voorkomt inzoomen op iOS Safari bij input focus
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TooltipProvider>
              <AuthGuard>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </AuthGuard>
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
