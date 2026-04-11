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
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const isKeyboardOpen = useKeyboardOpen();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    
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
        <TextInput
          value={fullName}
          onChange={(e) => { setFullName(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')); setError(''); }}
          placeholder="Nombre completo"
          error={error}
          enterKeyHint="go"
        />
        
        <div className={`fixed bottom-0 left-0 right-0 p-[24px] md:static md:p-0 bg-gradient-to-t from-[#000000] to-transparent md:bg-none z-20 mt-4 flex flex-col ${isKeyboardOpen ? 'hidden' : ''}`}>
          <PrimaryButton type="submit" disabled={!fullName.trim()}>
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
