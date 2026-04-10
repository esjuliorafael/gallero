import { Loader2 } from 'lucide-react';
import { useKeyboardOpen } from '@/hooks/use-keyboard-open';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  isFixedMobile?: boolean;
}

export function PrimaryButton({ children, isLoading, isFixedMobile, className = '', ...props }: PrimaryButtonProps) {
  const isKeyboardOpen = useKeyboardOpen();

  return (
    <div className={`${isFixedMobile ? `fixed bottom-0 left-0 right-0 p-[24px] md:static md:p-0 bg-gradient-to-t from-[#000000] to-transparent md:bg-none z-20 ${isKeyboardOpen ? 'hidden' : ''}` : ''}`}>
      <button
        {...props}
        disabled={isLoading || props.disabled}
        className={`w-full h-[48px] bg-[#A61717] hover:bg-[#8C1212] active:bg-[#6E0E0E] active:scale-[0.98] disabled:bg-[#4A0A0A] disabled:text-[#888888] disabled:cursor-not-allowed disabled:opacity-60 text-[#E6E6E6] font-semibold text-[16px] rounded-[12px] flex items-center justify-center transition-all ${className}`}
      >
        {isLoading ? <Loader2 className="animate-spin" size={20} color="#E6E6E6" /> : children}
      </button>
    </div>
  );
}
