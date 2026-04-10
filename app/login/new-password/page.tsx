'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { Title, Description } from '@/components/Typography';
import { PinInput } from '@/components/PinInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useKeyboardOpen } from '@/hooks/use-keyboard-open';

export default function NewPasswordPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const isKeyboardOpen = useKeyboardOpen();

  const validatePin = (p: string) => {
    if (p.length !== 4) return false;
    
    // Check consecutive
    const isConsecutive = '0123456789'.includes(p) || '9876543210'.includes(p);
    if (isConsecutive) {
      setErrorMsg('La contraseña no puede tener números consecutivos.');
      return false;
    }
    
    // Check pairs (e.g. 1122, 3344)
    if (p[0] === p[1] && p[2] === p[3]) {
      setErrorMsg('La contraseña no puede tener pares repetidos.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return;
    
    if (!validatePin(pin)) return;
    
    router.push('/dashboard');
  };

  return (
    <AuthLayout>
      <Title>Crea tu contraseña</Title>
      <Description className="mt-2">
        Crea una contraseña de 4 dígitos, sin dígitos consecutivos (por ejemplo, 1234) ni dígitos repetidos (por ejemplo, 1122).
      </Description>
      
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col">
        <PinInput value={pin} onChange={(val) => { setPin(val); setErrorMsg(''); }} error={!!errorMsg} />
        {errorMsg && <p className="text-[#EF4444] text-[11px] font-normal text-center mt-2">{errorMsg}</p>}
        
        <div className={`fixed bottom-0 left-0 right-0 p-[24px] md:static md:p-0 bg-gradient-to-t from-[#000000] to-transparent md:bg-none z-20 mt-4 flex flex-col ${isKeyboardOpen ? 'hidden' : ''}`}>
          <PrimaryButton type="submit" disabled={pin.length < 4}>
            Crear contraseña
          </PrimaryButton>
          <div className="mt-2">
            <p className="text-center font-normal text-[12px] leading-[16px] text-[#D3D3D3]">
              Esta es tu contraseña para iniciar sesión
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
