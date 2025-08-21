import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Check on mount (client-side)
    checkIsMobile()

    window.addEventListener("resize", checkIsMobile)
    
    // Cleanup listener on unmount
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  return isMobile
}
