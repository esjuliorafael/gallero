'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { Title, Description } from '@/components/Typography';
import { TextInput } from '@/components/TextInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryLink } from '@/components/SecondaryLink';
import { useKeyboardOpen } from '@/hooks/use-keyboard-open';

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const isKeyboardOpen = useKeyboardOpen();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) return;
    
    if (code === '0000') {
      setError('Código incorrecto o expirado. Inténtalo de nuevo.');
      return;
    }
    
    router.push('/login/new-password');
  };

  const handleResend = (e: React.MouseEvent) => {
    e.preventDefault();
    if (countdown > 0) return;
    setCountdown(60);
    // Simulate resend
  };

  return (
    <AuthLayout>
      <Title>Verificación</Title>
      <Description className="mt-2">
        Para verificar tu número de celular te enviamos un código de verificación por WhatsApp.
      </Description>
      
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col">
        <TextInput
          type="number"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(''); }}
          placeholder="Código de verificación"
          error={error}
          enterKeyHint="go"
        />
        
        <div className={`fixed bottom-0 left-0 right-0 p-[24px] md:static md:p-0 bg-gradient-to-t from-[#000000] to-transparent md:bg-none z-20 mt-4 flex flex-col ${isKeyboardOpen ? 'hidden' : ''}`}>
          <PrimaryButton type="submit" disabled={code.length === 0}>
            Verificar
          </PrimaryButton>
          <div className="mt-2">
            {countdown > 0 ? (
              <SecondaryLink text="¿No has recibido el código?" linkText={`Reenviar en 0:${countdown.toString().padStart(2, '0')}`} href="#" disabled />
            ) : (
              <SecondaryLink text="¿No has recibido el código?" linkText="Reenviar" href="#" onClick={handleResend} />
            )}
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
