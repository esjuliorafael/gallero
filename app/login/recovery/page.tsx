'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { Title, Description } from '@/components/Typography';
import { CountryCodePicker } from '@/components/CountryCodePicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryLink } from '@/components/SecondaryLink';

export default function RecoveryPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) return;
    
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    
    // In a real app, we'd pass the phone via state management or URL params
    router.push('/login/verify?phone=' + phone);
  };

  return (
    <AuthLayout>
      <Title>¿Olvidaste tu contraseña?</Title>
      <Description className="mt-2">
        Introduce tu número de celular y recibirás un código de verificación por WhatsApp para crear una nueva contraseña.
      </Description>
      
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col">
        <CountryCodePicker
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
          placeholder="Número de celular"
        />
        
        <div className="mt-4">
          <PrimaryButton type="submit" isFixedMobile isLoading={isLoading} disabled={phone.length < 10}>
            Enviar
          </PrimaryButton>
        </div>
        
        <div className="mt-2">
          <SecondaryLink text="¿No tienes cuenta?" linkText="Regístrate" href="/register" />
        </div>
      </form>
    </AuthLayout>
  );
}
