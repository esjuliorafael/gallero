export function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="font-bold text-[24px] leading-[32px] text-[#E6E6E6] text-center md:text-left">{children}</h1>;
}

export function Description({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <p className={`font-normal text-[12px] leading-[16px] text-[#D3D3D3] text-center md:text-left ${className}`}>{children}</p>;
}
