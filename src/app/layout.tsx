import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Whatooz — Automatisation WhatsApp en Afrique',
  description:
    'Whatooz par Onlice — La plateforme premium d\'automatisation WhatsApp en Afrique. Gérez vos conversations, templates et campagnes depuis une interface épurée.',
  keywords: [
    'automatisation WhatsApp',
    'whatooz',
    'onlice',
    'CRM WhatsApp',
    'WhatsApp Business API',
    'Afrique',
  ],
  authors: [{ name: 'Onlice' }],
  openGraph: {
    title: 'Whatooz — Automatisation WhatsApp en Afrique',
    description:
      'La plateforme premium d\'automatisation WhatsApp en Afrique par Onlice.',
    url: 'https://whatooz.space',
    siteName: 'Whatooz',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        {/* Cabinet Grotesk (headings) + Inter (body) */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
