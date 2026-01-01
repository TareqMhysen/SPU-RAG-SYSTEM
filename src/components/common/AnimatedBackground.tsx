import React, { useEffect, useState, useMemo } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

const AnimatedBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 50, y: 50 });
  const [trailPos, setTrailPos] = useState<MousePosition>({ x: 50, y: 50 });
  const [slowTrailPos, setSlowTrailPos] = useState<MousePosition>({ x: 50, y: 50 });

  // Generate random star positions - 70 stars
  const stars = useMemo(() => 
    [...Array(70)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 8,
      duration: 3 + Math.random() * 4,
    })), []
  );

  // Meteor positions - 4 meteors spread across screen
  const meteors = useMemo(() => 
    [...Array(4)].map((_, i) => ({
      top: 8 + i * 22 + Math.random() * 10,
      delay: i * 4 + Math.random() * 2,
      duration: 3 + Math.random() * 2,
      size: 60 + Math.random() * 40,
    })), []
  );

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Smooth trail animations using requestAnimationFrame
  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      setTrailPos(prev => ({
        x: prev.x + (mousePos.x - prev.x) * 0.12,
        y: prev.y + (mousePos.y - prev.y) * 0.12,
      }));
      setSlowTrailPos(prev => ({
        x: prev.x + (mousePos.x - prev.x) * 0.04,
        y: prev.y + (mousePos.y - prev.y) * 0.04,
      }));
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [mousePos]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base gradient - Dark mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:block hidden" />
      {/* Base gradient - Light mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 dark:hidden block" />
      
      {/* Corner glows - Dark mode - SLOW FLOATING */}
      <div 
        className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-blue-600/50 to-cyan-500/40 rounded-full blur-[120px] dark:block hidden" 
        style={{ animation: 'slowFloat 25s ease-in-out infinite' }} 
      />
      <div 
        className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/50 to-pink-500/40 rounded-full blur-[120px] dark:block hidden" 
        style={{ animation: 'slowFloat 30s ease-in-out infinite reverse' }} 
      />
      <div 
        className="absolute top-1/3 -right-20 w-[400px] h-[400px] bg-gradient-to-br from-cyan-500/30 to-blue-600/30 rounded-full blur-[100px] dark:block hidden" 
        style={{ animation: 'slowFloat 28s ease-in-out infinite 2s' }} 
      />

      {/* Corner glows - Light mode - SLOW FLOATING */}
      <div 
        className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/40 to-cyan-300/30 rounded-full blur-[120px] dark:hidden block" 
        style={{ animation: 'slowFloat 25s ease-in-out infinite' }} 
      />
      <div 
        className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-purple-400/40 to-pink-300/30 rounded-full blur-[120px] dark:hidden block" 
        style={{ animation: 'slowFloat 30s ease-in-out infinite reverse' }} 
      />
      <div 
        className="absolute top-1/3 -right-20 w-[400px] h-[400px] bg-gradient-to-br from-cyan-300/30 to-blue-400/30 rounded-full blur-[100px] dark:hidden block" 
        style={{ animation: 'slowFloat 28s ease-in-out infinite 2s' }} 
      />

      {/* Mouse tracking spotlight - Primary - Dark mode */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full dark:block hidden"
        style={{
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, rgba(236, 72, 153, 0.3) 40%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      />
      {/* Mouse tracking spotlight - Primary - Light mode (lighter) */}
      <div
        className="absolute w-[200px] h-[200px] rounded-full dark:hidden block"
        style={{
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.1) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Mouse tracking trail - Secondary - Dark mode */}
      <div
        className="absolute w-[250px] h-[250px] rounded-full dark:block hidden"
        style={{
          left: `${trailPos.x}%`,
          top: `${trailPos.y}%`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.4) 0%, rgba(59, 130, 246, 0.25) 50%, transparent 70%)',
          filter: 'blur(35px)',
        }}
      />
      {/* Mouse tracking trail - Secondary - Light mode (lighter) */}
      <div
        className="absolute w-[180px] h-[180px] rounded-full dark:hidden block"
        style={{
          left: `${trailPos.x}%`,
          top: `${trailPos.y}%`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 70%)',
          filter: 'blur(45px)',
        }}
      />

      {/* Mouse tracking trail - Slow - Dark mode */}
      <div
        className="absolute w-[350px] h-[350px] rounded-full dark:block hidden"
        style={{
          left: `${slowTrailPos.x}%`,
          top: `${slowTrailPos.y}%`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.2) 50%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />
      {/* Mouse tracking trail - Slow - Light mode (very light) */}
      <div
        className="absolute w-[250px] h-[250px] rounded-full dark:hidden block"
        style={{
          left: `${slowTrailPos.x}%`,
          top: `${slowTrailPos.y}%`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, rgba(236, 72, 153, 0.05) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Floating orbs - SLOW floating - Dark mode */}
      <div className="absolute top-[8%] left-[8%] w-80 h-80 dark:block hidden" style={{ animation: 'slowFloat 25s ease-in-out infinite' }}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500/60 to-cyan-400/50 blur-[60px]" />
      </div>
      <div className="absolute bottom-[12%] right-[8%] w-96 h-96 dark:block hidden" style={{ animation: 'slowFloat 30s ease-in-out infinite reverse' }}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500/55 to-pink-500/45 blur-[65px]" />
      </div>
      <div className="absolute top-[30%] left-[35%] w-72 h-72 dark:block hidden" style={{ animation: 'slowFloat 28s ease-in-out infinite 3s' }}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500/45 to-teal-400/35 blur-[55px]" />
      </div>
      <div className="absolute bottom-[8%] left-[20%] w-80 h-80 dark:block hidden" style={{ animation: 'slowFloat 32s ease-in-out infinite 5s' }}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-500/50 via-red-500/40 to-pink-500/45 blur-[60px]" />
      </div>

      {/* Floating orbs - Light mode - SLOW floating */}
      <div className="absolute top-[8%] left-[8%] w-80 h-80 dark:hidden block" style={{ animation: 'slowFloat 25s ease-in-out infinite' }}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400/50 to-cyan-300/40 blur-[60px]" />
      </div>
      <div className="absolute bottom-[12%] right-[8%] w-96 h-96 dark:hidden block" style={{ animation: 'slowFloat 30s ease-in-out infinite reverse' }}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400/45 to-pink-400/35 blur-[65px]" />
      </div>
      <div className="absolute top-[30%] left-[35%] w-72 h-72 dark:hidden block" style={{ animation: 'slowFloat 28s ease-in-out infinite 3s' }}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400/35 to-teal-300/25 blur-[55px]" />
      </div>
      <div className="absolute bottom-[8%] left-[20%] w-80 h-80 dark:hidden block" style={{ animation: 'slowFloat 32s ease-in-out infinite 5s' }}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-400/40 via-red-400/30 to-pink-400/35 blur-[60px]" />
      </div>

      {/* Meteors - spread out - Dark mode only */}
      {meteors.map((meteor, i) => (
        <div
          key={`meteor-${i}`}
          className="absolute dark:block hidden"
          style={{
            top: `${meteor.top}%`,
            left: '-10%',
            animation: `meteor ${meteor.duration}s linear infinite`,
            animationDelay: `${meteor.delay}s`,
          }}
        >
          <div 
            className="h-0.5 bg-gradient-to-r from-transparent via-white to-cyan-300 rounded-full"
            style={{ width: `${meteor.size}px` }}
          />
          <div 
            className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_4px_rgba(255,255,255,0.8),0_0_20px_8px_rgba(34,211,238,0.5)]"
          />
        </div>
      ))}

      {/* Stars - Dark mode */}
      {stars.map((star, i) => (
        <div
          key={`star-${i}`}
          className="absolute rounded-full bg-white dark:block hidden"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animation: `twinkle ${star.duration}s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
            boxShadow: `0 0 ${star.size * 3}px ${star.size}px rgba(255,255,255,0.6)`,
          }}
        />
      ))}

      {/* Stars - Light mode (subtle) */}
      {stars.slice(0, 35).map((star, i) => (
        <div
          key={`star-light-${i}`}
          className="absolute rounded-full bg-indigo-400 dark:hidden block"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size * 0.8}px`,
            height: `${star.size * 0.8}px`,
            animation: `twinkle ${star.duration}s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
            boxShadow: `0 0 ${star.size * 2}px ${star.size * 0.5}px rgba(99,102,241,0.4)`,
          }}
        />
      ))}

      {/* Floating particles - Dark mode */}
      {[...Array(10)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full dark:block hidden"
          style={{
            left: `${10 + (i * 8) % 80}%`,
            bottom: '0%',
            background: i % 2 === 0 ? 'rgba(168, 85, 247, 0.8)' : 'rgba(34, 211, 238, 0.8)',
            animation: `floatUp ${10 + (i % 5) * 2}s linear infinite`,
            animationDelay: `${i * 0.8}s`,
            boxShadow: i % 2 === 0 
              ? '0 0 6px 2px rgba(168, 85, 247, 0.6)' 
              : '0 0 6px 2px rgba(34, 211, 238, 0.6)',
          }}
        />
      ))}

      {/* Subtle blur overlay */}
      <div className="absolute inset-0 backdrop-blur-[0.5px] dark:block hidden" />

      {/* CSS Keyframes */}
      <style>{`
        @keyframes slowFloat {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(30px, -25px); }
          50% { transform: translate(15px, -50px); }
          75% { transform: translate(-15px, -25px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes meteor {
          0% { transform: translateX(0) translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(120vw) translateY(40vh); opacity: 0; }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;

