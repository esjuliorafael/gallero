'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { Title, Description } from '@/components/Typography';
import { CountryCodePicker } from '@/components/CountryCodePicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LegalText } from '@/components/LegalText';
import Link from 'next/link';

export default function RegisterPhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) return;
    
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    
    // Simulate existing user check
    if (phone === '5555555555') {
      setError('Este número ya tiene una cuenta. ¿Quieres iniciar sesión?');
      return;
    }
    
    router.push('/register/verify?phone=' + phone);
  };

  return (
    <AuthLayout>
      <div className="flex justify-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#535353]" />
        <div className="w-2 h-2 rounded-full bg-[#A61717]" />
      </div>
      
      <Title>¿Cuál es tu número de celular (10 dígitos)?</Title>
      <Description className="mt-2">
        Para crear tu cuenta, necesitamos tu número de celular para enviarte un código de verificación por WhatsApp.
      </Description>
      
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col">
        <CountryCodePicker
          value={phone}
          onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
          placeholder="Número de celular"
          error={error ? ' ' : undefined} // Just to trigger red border
        />
        {error && (
          <p className="text-[#EF4444] text-[11px] font-normal mt-1">
            Este número ya tiene una cuenta. <Link href="/login" className="font-semibold underline">¿Quieres iniciar sesión?</Link>
          </p>
        )}
        
        <div className="mt-4">
          <PrimaryButton type="submit" isFixedMobile isLoading={isLoading} disabled={phone.length < 10}>
            Enviar
          </PrimaryButton>
        </div>
        
        <div className="mt-2">
          <LegalText />
        </div>
      </form>
    </AuthLayout>
  );
}
