import React, { forwardRef } from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        <input
          ref={ref}
          {...props}
          className={`w-full h-[48px] bg-transparent border-2 ${error ? 'border-[#EF4444]' : 'border-[#535353] focus:border-[#A61717]'} rounded-[12px] px-[16px] text-[#E6E6E6] font-semibold text-[20px] outline-none placeholder:text-[#535353] placeholder:font-semibold placeholder:text-[16px] transition-colors ${className}`}
        />
        {error && <span className="text-[#EF4444] text-[11px] font-normal">{error}</span>}
      </div>
    );
  }
);
TextInput.displayName = 'TextInput';
