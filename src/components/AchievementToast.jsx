import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Trophy, Compass, Notebook, Hammer, Cpu, Zap, Globe, Folder, X } from 'lucide-react';

gsap.registerPlugin(useGSAP);

const ICON_MAP = {
  Compass,
  Notebook,
  Hammer,
  Cpu,
  Zap,
  Globe,
  Folder,
  Trophy
};

export default function AchievementToast() {
  const [activeBadge, setActiveBadge] = useState(null);
  const toastRef = useRef(null);
  const confettiRef = useRef(null);

  useEffect(() => {
    const handleUnlock = (e) => {
      setActiveBadge(e.detail);
    };

    window.addEventListener('yc_achievement_unlocked', handleUnlock);
    return () => {
      window.removeEventListener('yc_achievement_unlocked', handleUnlock);
    };
  }, []);

  useGSAP(() => {
    if (activeBadge && toastRef.current) {
      // 1. Toast slide-in and bounce
      gsap.fromTo(toastRef.current,
        { y: 100, x: 50, scale: 0.9, opacity: 0 },
        { y: 0, x: 0, scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.5)' }
      );

      // 2. Confetti particle burst
      if (confettiRef.current) {
        const particles = confettiRef.current.querySelectorAll('.confetti-particle');
        gsap.set(particles, { x: 0, y: 0, scale: () => gsap.utils.random(0.5, 1.5), rotation: 0 });
        
        gsap.to(particles, {
          x: () => gsap.utils.random(-150, 150),
          y: () => gsap.utils.random(-150, -50),
          rotation: () => gsap.utils.random(0, 360),
          opacity: 0,
          duration: () => gsap.utils.random(0.8, 1.5),
          ease: 'power2.out',
          stagger: 0.005
        });
      }

      // Auto close after 5 seconds
      const timeout = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, { scope: toastRef, dependencies: [activeBadge] });

  const handleClose = () => {
    if (toastRef.current) {
      gsap.to(toastRef.current, {
        y: 80,
        opacity: 0,
        scale: 0.9,
        duration: 0.3,
        onComplete: () => setActiveBadge(null)
      });
    } else {
      setActiveBadge(null);
    }
  };

  if (!activeBadge) return null;

  const IconComponent = ICON_MAP[activeBadge.icon] || Trophy;

  return (
    <div
      ref={toastRef}
      className="fixed bottom-6 right-6 z-50 brutal-card p-4 w-[280px] bg-white shadow-[6px_6px_0px_0px_#000000] border-2 border-black flex items-start space-x-3.5 select-none"
    >
      {/* Confetti container (absolute overlay anchor) */}
      <div ref={confettiRef} className="absolute left-6 top-6 w-0 h-0 overflow-visible pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => {
          const colors = ['#00bce6', '#e60073', '#00d37e', '#fbbf24', '#ff7700'];
          const randColor = colors[i % colors.length];
          return (
            <div
              key={i}
              className="confetti-particle absolute w-2 h-2 rounded-sm border border-black/10"
              style={{ backgroundColor: randColor }}
            />
          );
        })}
      </div>

      {/* Badge Icon */}
      <div
        className="w-10 h-10 rounded border-2 border-black flex items-center justify-center shrink-0 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        style={{ backgroundColor: activeBadge.color }}
      >
        <IconComponent className="w-5 h-5 animate-pulse" />
      </div>

      {/* Description */}
      <div className="flex-grow min-w-0">
        <span className="font-mono-code text-[8px] text-neon-orange font-extrabold uppercase tracking-widest block mb-0.5">
          Achievement Unlocked!
        </span>
        <h4 className="font-mono-tech text-xs font-extrabold text-black uppercase leading-tight">
          {activeBadge.name}
        </h4>
        <p className="font-sans-body text-[10px] text-slate-700 leading-snug font-medium mt-1">
          {activeBadge.description}
        </p>
      </div>

      <button
        onClick={handleClose}
        className="text-slate-400 hover:text-black shrink-0 cursor-pointer p-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
