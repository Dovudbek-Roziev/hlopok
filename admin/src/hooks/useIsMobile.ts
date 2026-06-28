import { useState, useEffect } from 'react';

export const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < breakpoint,
  );
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [breakpoint]);
  return isMobile;
};
