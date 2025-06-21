import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [fade, setFade] = useState(false);
  useEffect(() => {
    const timer1 = setTimeout(() => setFade(true), 1800); // Start fade after 1.8s
    const timer2 = setTimeout(onFinish, 2500); // Remove after fade
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [onFinish]);
  return (
    <div style={{
      position: 'fixed', zIndex: 9999, top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'linear-gradient(135deg, #232b3a 0%, #90caf9 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: fade ? 0 : 1, transition: 'opacity 700ms', pointerEvents: 'none',
    }}>
      <svg width="320" height="320" viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="160" cy="160" r="120" fill="#fff" fillOpacity="0.12" />
        <ellipse cx="160" cy="160" rx="90" ry="120" fill="#1976d2" fillOpacity="0.18" />
        {/* Trophy Deer Head with Proud Chest and Best Horns */}
        <g>
          {/* Chest */}
          <ellipse cx="160" cy="210" rx="38" ry="28" fill="#fff" stroke="#8d6748" strokeWidth="4" />
          {/* Head */}
          <ellipse cx="160" cy="150" rx="22" ry="28" fill="#bfa074" stroke="#8d6748" strokeWidth="4" />
          {/* Nose */}
          <ellipse cx="160" cy="175" rx="7" ry="5" fill="#4b2e13" />
          {/* Eyes */}
          <ellipse cx="150" cy="150" rx="3" ry="5" fill="#222" />
          <ellipse cx="170" cy="150" rx="3" ry="5" fill="#222" />
          {/* Proud Chest shadow */}
          <ellipse cx="160" cy="220" rx="18" ry="8" fill="#bfa074" fillOpacity="0.4" />
          {/* Horns - left */}
          <path d="M145 130 Q120 80 160 70 Q120 60 145 130" stroke="#e6d7b0" strokeWidth="7" fill="none" strokeLinecap="round"/>
          <path d="M150 120 Q130 60 160 60 Q130 50 150 120" stroke="#e6d7b0" strokeWidth="5" fill="none" strokeLinecap="round"/>
          {/* Horns - right */}
          <path d="M175 130 Q200 80 160 70 Q200 60 175 130" stroke="#e6d7b0" strokeWidth="7" fill="none" strokeLinecap="round"/>
          <path d="M170 120 Q190 60 160 60 Q190 50 170 120" stroke="#e6d7b0" strokeWidth="5" fill="none" strokeLinecap="round"/>
        </g>
        <text x="50%" y="260" textAnchor="middle" fontFamily="Inter,Arial,sans-serif" fontWeight="bold" fontSize="1.5rem" fill="#fff" style={{letterSpacing:2}}>
          Splitting Image
        </text>
        <text x="50%" y="285" textAnchor="middle" fontFamily="Inter,Arial,sans-serif" fontSize="1.1rem" fill="#90caf9">
          Taxidermy
        </text>
      </svg>
    </div>
  );
};
export default SplashScreen;
