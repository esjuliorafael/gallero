import Link from 'next/link';

interface SecondaryLinkProps {
  text: string;
  linkText: string;
  href: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

export function SecondaryLink({ text, linkText, href, onClick, disabled }: SecondaryLinkProps) {
  if (disabled) {
    return (
      <p className="text-center font-normal text-[12px] leading-[32px] text-[#D3D3D3]">
        {text} <span className="font-semibold text-[#535353]">{linkText}</span>
      </p>
    );
  }
  
  return (
    <p className="text-center font-normal text-[12px] leading-[32px] text-[#D3D3D3]">
      {text} <Link href={href} onClick={onClick} className="font-semibold text-[#D3D3D3] hover:text-[#A61717] focus:text-[#A61717] transition-colors">{linkText}</Link>
    </p>
  );
}
