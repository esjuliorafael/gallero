import type {Metadata} from 'next';
import { Poppins } from 'next/font/google';
import './globals.css'; // Global styles

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Gallero',
  description: 'Plataforma de Apuestas para Derbys de Gallos',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${poppins.variable} font-sans`}>
      <body className="antialiased min-h-[100dvh] bg-gradient-to-b from-[#0D0D0D] to-[#000000] text-[#E6E6E6]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
