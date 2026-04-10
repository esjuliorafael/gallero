'use client'
import { useState, useEffect } from 'react'

export function useKeyboardOpen(): boolean {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        setIsKeyboardOpen(true)
      }
    }

    const handleFocusOut = () => {
      // Small delay so the state doesn't flicker when moving between inputs
      setTimeout(() => {
        const active = document.activeElement
        const isInput =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active instanceof HTMLSelectElement ||
          (active instanceof HTMLElement && active.isContentEditable)
        if (!isInput) setIsKeyboardOpen(false)
      }, 100)
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  return isKeyboardOpen
}
