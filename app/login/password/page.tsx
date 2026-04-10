'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { Title, Description } from '@/components/Typography';
import { PinInput } from '@/components/PinInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryLink } from '@/components/SecondaryLink';
import { Toast } from '@/components/Toast';
import { useKeyboardOpen } from '@/hooks/use-keyboard-open';

export default function LoginPasswordPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const isKeyboardOpen = useKeyboardOpen();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return;
    
    // Simulate validation
    if (pin === '1234') { // Just a dummy check for error state
      setError(true);
      setShowToast(true);
      setPin('');
      return;
    }
    
    router.push('/dashboard');
  };

  return (
    <AuthLayout>
      {showToast && (
        <Toast 
          message="Contraseña incorrecta. Inténtalo de nuevo." 
          type="error" 
          onClose={() => setShowToast(false)} 
        />
      )}
      
      <Title>Introduce tu contraseña numérica (4 dígitos)</Title>
      <Description className="mt-2">
        Introduce la contraseña que elegiste al crear tu cuenta; esta es tu contraseña para iniciar sesión.
      </Description>
      
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col">
        <PinInput value={pin} onChange={(val) => { setPin(val); setError(false); }} error={error} />
        
        <div className={`fixed bottom-0 left-0 right-0 p-[24px] md:static md:p-0 bg-gradient-to-t from-[#000000] to-transparent md:bg-none z-20 mt-4 flex flex-col ${isKeyboardOpen ? 'hidden' : ''}`}>
          <PrimaryButton type="submit" disabled={pin.length < 4}>
            Iniciar sesión
          </PrimaryButton>
          <div className="mt-2">
            <SecondaryLink text="" linkText="¿Olvidaste tu contraseña?" href="/login/recovery" />
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
