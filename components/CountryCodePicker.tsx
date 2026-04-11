import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';

interface CountryCodePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const CountryCodePicker = forwardRef<HTMLInputElement, CountryCodePickerProps>(
  ({ error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        <div className="flex gap-[8px] w-full">
          <button type="button" className="w-[96px] h-[48px] bg-transparent border-2 border-[#535353] rounded-[12px] flex items-center justify-center gap-[4px] text-[#E6E6E6] font-semibold text-[16px] leading-none shrink-0">
            +52
            <ChevronDown size={24} color="#E3E3E3" />
          </button>
          <div className="flex-1">
            <input
              ref={ref}
              type="tel"
              maxLength={10}
              pattern="[0-9]{10}"
              {...props}
              className={`w-full h-[48px] bg-transparent border-2 ${error ? 'border-[#EF4444]' : 'border-[#535353] focus:border-[#A61717]'} rounded-[12px] px-[16px] text-[#E6E6E6] font-semibold text-[16px] leading-none outline-none placeholder:text-[#535353] placeholder:font-semibold transition-colors`}
            />
          </div>
        </div>
        {error && <span className="text-[#EF4444] text-[11px] font-normal">{error}</span>}
      </div>
    );
  }
);
CountryCodePicker.displayName = 'CountryCodePicker';
