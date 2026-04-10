'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { Title, Description } from '@/components/Typography';
import { TextInput } from '@/components/TextInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LegalText } from '@/components/LegalText';
import { useKeyboardOpen } from '@/hooks/use-keyboard-open';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const isKeyboardOpen = useKeyboardOpen();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) return;
    
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
      setError('Solo se permiten letras y espacios');
      return;
    }
    
    router.push('/register/phone');
  };

  return (
    <AuthLayout>
      <div className="flex justify-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#A61717]" />
        <div className="w-2 h-2 rounded-full bg-[#535353]" />
      </div>
      
      <Title>¿Cómo te llamas?</Title>
      <Description className="mt-2">
        Vamos a empezar a crear tu cuenta. Dinos, ¿cuál es tu nombre y apellido?
      </Description>
      
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col">
        <div className="flex gap-[8px]">
          <div className="flex-1">
            <TextInput
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setError(''); }}
              placeholder="Nombre(s)"
              error={error}
            />
          </div>
          <div className="flex-1">
            <TextInput
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setError(''); }}
              placeholder="Apellido(s)"
              error={error}
            />
          </div>
        </div>
        
        <div className={`fixed bottom-0 left-0 right-0 p-[24px] md:static md:p-0 bg-gradient-to-t from-[#000000] to-transparent md:bg-none z-20 mt-4 flex flex-col ${isKeyboardOpen ? 'hidden' : ''}`}>
          <PrimaryButton type="submit" disabled={!firstName || !lastName}>
            Registrarme
          </PrimaryButton>
          <div className="mt-2">
            <LegalText />
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
