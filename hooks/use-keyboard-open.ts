'use client'
import { useState, useEffect } from 'react'

const KEYBOARD_THRESHOLD = 150

export function useKeyboardOpen(): boolean {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const handleResize = () => {
      setIsKeyboardOpen(window.innerHeight - vv.height > KEYBOARD_THRESHOLD)
    }

    vv.addEventListener('resize', handleResize)
    handleResize()
    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  return isKeyboardOpen
}
