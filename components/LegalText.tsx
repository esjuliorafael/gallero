import Link from 'next/link';

export function LegalText() {
  return (
    <p className="text-center font-normal text-[12px] leading-[16px] text-[#D3D3D3] tracking-[-0.24px] mt-2">
      Al registrarte confirmas que tienes 18 años o más y aceptas los <Link href="#" className="font-semibold tracking-[-0.32px] hover:text-[#A61717] transition-colors">Términos y Condiciones</Link> y el <Link href="#" className="font-semibold tracking-[-0.32px] hover:text-[#A61717] transition-colors">Aviso de Privacidad</Link>
    </p>
  );
}
