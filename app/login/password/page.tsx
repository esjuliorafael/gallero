'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { Title, Description } from '@/components/Typography';
import { PinInput } from '@/components/PinInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryLink } from '@/components/SecondaryLink';
import { Toast } from '@/components/Toast';

export default function LoginPasswordPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showToast, setShowToast] = useState(false);

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
        
        <div className="mt-4">
          <PrimaryButton type="submit" isFixedMobile disabled={pin.length < 4}>
            Iniciar sesión
          </PrimaryButton>
        </div>
        
        <div className="mt-2">
          <SecondaryLink text="" linkText="¿Olvidaste tu contraseña?" href="/login/recovery" />
        </div>
      </form>
    </AuthLayout>
  );
}
