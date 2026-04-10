'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';

export default function AuthLayout({ children, showBack = true }: { children: React.ReactNode, showBack?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isWelcome = pathname === '/welcome';

  return (
    <div className="min-h-[100dvh] flex flex-col relative">
      {/* Header Desktop */}
      <header className="hidden md:flex h-[80px] items-center justify-between px-8 w-full absolute top-0 left-0">
        <div className="flex items-center">
          <Logo width={254} height={32} />
        </div>
        {!pathname.startsWith('/register') && (
          <Link href="/register" className="flex items-center justify-center bg-[#A61717] hover:bg-[#8C1212] text-[#E6E6E6] font-semibold text-[16px] rounded-[12px] w-[128px] h-[48px] transition-colors">
            Regístrate
          </Link>
        )}
      </header>

      {/* Header Mobile */}
      <header className="md:hidden flex items-center h-[72px] px-[24px] w-full absolute top-0 left-0 z-10">
        {showBack && !isWelcome && (
          <button onClick={() => router.back()} className="mr-4 text-[#E6E6E6]">
            <ArrowLeft size={24} />
          </button>
        )}
        <Logo width={191} height={24} />
      </header>

      {/* Content Area */}
      <main className="flex-1 flex flex-col justify-center md:items-center md:justify-center px-[24px] md:px-0 pt-[72px] md:pt-0 pb-[120px] md:pb-0">
        <div className="w-full md:w-[300px] flex flex-col gap-[16px]">
          {children}
        </div>
      </main>
    </div>
  );
}
