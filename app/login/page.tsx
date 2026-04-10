'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { Title, Description } from '@/components/Typography';
import { CountryCodePicker } from '@/components/CountryCodePicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryLink } from '@/components/SecondaryLink';
import { useKeyboardOpen } from '@/hooks/use-keyboard-open';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const isKeyboardOpen = useKeyboardOpen();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('El número debe tener 10 dígitos');
      return;
    }
    // Simulate API call
    router.push('/login/password');
  };

  return (
    <AuthLayout showBack={false}>
      <Title>¿Cuál es tu número de celular (10 dígitos)?</Title>
      <Description className="mt-2">
        Inicia sesión con el número de celular que utilizaste anteriormente para crear tu cuenta.
      </Description>
      
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col">
        <CountryCodePicker
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, ''));
            setError('');
          }}
          error={error}
          placeholder="Número de celular"
        />
        
        <div className={`fixed bottom-0 left-0 right-0 p-[24px] md:static md:p-0 bg-gradient-to-t from-[#000000] to-transparent md:bg-none z-20 mt-4 flex flex-col ${isKeyboardOpen ? 'hidden' : ''}`}>
          <PrimaryButton type="submit" disabled={phone.length < 10}>
            Iniciar sesión
          </PrimaryButton>
          <div className="mt-2">
            <SecondaryLink text="¿No tienes cuenta?" linkText="Regístrate" href="/register" />
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
