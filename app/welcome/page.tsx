'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LegalText } from '@/components/LegalText';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { motion, AnimatePresence } from 'motion/react';
import { useKeyboardOpen } from '@/hooks/use-keyboard-open';

export default function WelcomePage() {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const isKeyboardOpen = useKeyboardOpen();

  useEffect(() => {
    const checkDesktop = () => {
      if (window.innerWidth >= 768) {
        setIsDesktop(true);
        router.replace('/login');
      }
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, [router]);

  if (isDesktop) return null;

  return (
    <div className="min-h-[100dvh] bg-transparent relative flex flex-col">
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatedLogo 
          width={191} 
          height={24} 
          onComplete={() => setShowActions(true)} 
        />
      </div>
      
      <AnimatePresence>
        {showActions && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`fixed bottom-0 left-0 right-0 p-[24px] flex flex-col gap-[8px] z-20 ${isKeyboardOpen ? 'hidden' : ''}`}
          >
            <PrimaryButton onClick={() => router.push('/login')}>
              Iniciar sesión
            </PrimaryButton>
            <PrimaryButton onClick={() => router.push('/register')}>
              Regístrate
            </PrimaryButton>
            <div className="mt-2">
              <LegalText />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
