import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-[16px] left-1/2 -translate-x-1/2 w-max max-w-[90vw] bg-[#1A1A1A] border-l-4 ${type === 'error' ? 'border-[#A61717]' : 'border-[#22C55E]'} rounded-r-[8px] px-[16px] py-[12px] flex items-center gap-[12px] z-50 shadow-lg animate-[slideDown_0.2s_ease-out]`}>
      <span className="font-normal text-[13px] text-[#E6E6E6]">{message}</span>
      <button onClick={onClose} className="text-[#D3D3D3] hover:text-[#E6E6E6]">
        <X size={16} />
      </button>
    </div>
  );
}
