'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { Title, Description } from '@/components/Typography';
import { CountryCodePicker } from '@/components/CountryCodePicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryLink } from '@/components/SecondaryLink';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

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
        
        <div className="mt-4">
          <PrimaryButton type="submit" isFixedMobile disabled={phone.length < 10}>
            Iniciar sesión
          </PrimaryButton>
        </div>
        
        <div className="mt-2">
          <SecondaryLink text="¿No tienes cuenta?" linkText="Regístrate" href="/register" />
        </div>
      </form>
    </AuthLayout>
  );
}
