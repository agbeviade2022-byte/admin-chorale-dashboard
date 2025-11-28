import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard - Chorale SaaS",
    template: "%s | Admin Dashboard"
  },
  description: "Dashboard d'administration professionnel pour la gestion du SaaS musical",
  keywords: ['admin', 'dashboard', 'chorale', 'gestion', 'saas'],
  authors: [{ name: 'Chorale SaaS Team' }],
  creator: 'Chorale SaaS',
  publisher: 'Chorale SaaS',
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
