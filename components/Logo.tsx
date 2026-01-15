
import React from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
  variant?: 'full' | 'icon';
}

/**
 * Logo oficial do CoreStream.
 * Representa um "Pulso" de energia dentro de um frame moderno.
 */
const Logo: React.FC<LogoProps> = ({ size = 80, className = "", variant = 'icon' }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
      >
        {/* Frame Externo */}
        <rect x="10" y="10" width="80" height="80" rx="24" fill="white" />
        
        {/* Ícone de Pulso Interno */}
        <path 
          d="M30 50H40L45 35L55 65L60 50H70" 
          stroke="black" 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Detalhe de Brilho Core */}
        <circle cx="50" cy="50" r="35" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
      </svg>
      
      {variant === 'full' && (
        <div className="mt-4 text-center">
          <h1 className="text-4xl font-black italic tracking-tighter text-white">CORE</h1>
          <div className="h-1 w-12 bg-indigo-500 mx-auto mt-1 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default Logo;
