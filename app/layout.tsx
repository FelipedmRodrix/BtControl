import type {Metadata} from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'ArenaBT - Beach Tennis',
  description: 'Sistema profissional de gestão de torneios e campeonatos de Beach Tennis com suporte multi-arena.',
  openGraph: {
    title: 'ArenaBT - Beach Tennis',
    description: 'Sistema profissional de gestão de torneios e campeonatos de Beach Tennis com suporte multi-arena.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ArenaBT - Beach Tennis',
    description: 'Sistema profissional de gestão de torneios e campeonatos de Beach Tennis com suporte multi-arena.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="bg-white text-slate-900 font-sans min-h-screen antialiased selection:bg-emerald-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
