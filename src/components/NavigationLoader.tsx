"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface LoaderContextType {
  isNavigating: boolean;
  startNavigation: () => void;
}

const LoaderContext = createContext<LoaderContextType>({
  isNavigating: false,
  startNavigation: () => {},
});

export const useNavigationLoader = () => useContext(LoaderContext);

export default function NavigationLoaderProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset loading whenever route finishes changing
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  return (
    <LoaderContext.Provider value={{ isNavigating, startNavigation: () => setIsNavigating(true) }}>
      {children}
      
      {/* Global Overlay Loader */}
      {isNavigating && (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center animate-[fadeIn_0.2s_ease-out]">
          <div className="relative">
            {/* Outer Ring */}
            <div className="w-12 h-12 rounded-full absolute border-4 border-solid border-gray-700"></div>
            {/* Inner Spinning Ring */}
            <div className="w-12 h-12 rounded-full animate-spin absolute border-4 border-solid border-blue-500 border-t-transparent"></div>
          </div>
          <p className="mt-16 text-sm font-semibold text-blue-400 tracking-widest uppercase animate-pulse">Menghubungkan...</p>
        </div>
      )}
    </LoaderContext.Provider>
  );
}
