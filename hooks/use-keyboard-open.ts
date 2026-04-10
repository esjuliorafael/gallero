'use client'
import { useState, useEffect } from 'react'

const KEYBOARD_THRESHOLD = 150

export function useKeyboardOpen(): boolean {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    const detect = () => {
      const vv = window.visualViewport
      if (vv) {
        setIsKeyboardOpen(window.screen.height - vv.height > KEYBOARD_THRESHOLD)
      }
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        setTimeout(detect, 300)
      }
    }

    const handleFocusOut = () => {
      setTimeout(detect, 300)
    }

    const vv = window.visualViewport
    if (vv) vv.addEventListener('resize', detect)
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    detect()

    return () => {
      if (vv) vv.removeEventListener('resize', detect)
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  return isKeyboardOpen
}
