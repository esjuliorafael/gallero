'use client';

import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-[#0D0D0D] text-[#E6E6E6] flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-8">¡Bienvenido a Gallero!</p>
      
      <div className="w-full max-w-[300px]">
        <PrimaryButton onClick={() => router.push('/welcome')}>
          Cerrar sesión
        </PrimaryButton>
      </div>
    </div>
  );
}
