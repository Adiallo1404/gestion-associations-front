import { useState, useEffect } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handle = () => setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  const breakpoint: Breakpoint =
    size.width < 640  ? 'mobile'  :
    size.width < 1024 ? 'tablet'  : 'desktop'

  return {
    ...size,
    breakpoint,
    isMobile:  size.width < 640,
    isTablet:  size.width >= 640 && size.width < 1024,
    isDesktop: size.width >= 1024,
  }
}