import type {Metadata} from 'next';
import './globals.css'; // Global styles

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
    <html lang="pt-BR">
      <body suppressHydrationWarning className="bg-[#070b14] text-slate-100 min-h-screen antialiased selection:bg-emerald-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
