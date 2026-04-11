import React, { useRef } from 'react';

interface PinInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
}

export function PinInput({ value, onChange, error }: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const pins = value.split('').slice(0, 4);
  while (pins.length < 4) pins.push('');

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newPins = [...pins];
    newPins[index] = val.slice(-1);
    const newValue = newPins.join('');
    onChange(newValue);
    
    if (val && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pins[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted) {
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, 3);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className={`flex gap-[12px] justify-center w-[228px] mx-auto ${error ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}>
      {pins.map((pin, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={pin}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          enterKeyHint="go"
          className={`w-[48px] h-[48px] bg-transparent border-2 ${error ? 'border-[#EF4444]' : 'border-[#535353] focus:border-[#A61717]'} rounded-[12px] text-center text-[#E6E6E6] font-semibold text-[24px] outline-none transition-colors`}
        />
      ))}
    </div>
  );
}
