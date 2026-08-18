import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, ShieldCheck, Database } from 'lucide-react';
import { subscribeToAuth, loginWithProvider, logoutUser, isFirebaseConfigured } from '../lib/firebase';

export default function AuthBar({ onOpenProfile }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (provider) => {
    try {
      await loginWithProvider(provider);
    } catch (e) {
      alert(`Login failed: ${e.message}`);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <div className="flex items-center space-x-3 font-mono-tech select-none">
      {user ? (
        <div className="flex items-center space-x-2.5">
          {/* Status Badge */}
          <span 
            onClick={onOpenProfile}
            className="hidden md:inline-flex items-center space-x-1 text-[8px] bg-neon-emerald/10 border border-neon-emerald px-1.5 py-0.5 rounded font-mono-code text-neon-emerald font-bold cursor-pointer"
          >
            <ShieldCheck className="w-3 h-3" />
            <span>{isFirebaseConfigured ? 'CLOUD_CONNECTED' : 'LOCAL_SANDBOX'}</span>
          </span>

          {/* User Profile Trigger Button */}
          <button
            onClick={onOpenProfile}
            className="brutal-btn p-1 flex items-center justify-center shrink-0 w-8 h-8 overflow-hidden rounded-full hover:border-neon-cyan shadow-[1.5px_1.5px_0px_0px_#000000]"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="font-bold text-xs">{user.displayName?.charAt(0)}</span>
            )}
          </button>

          <span 
            onClick={onOpenProfile}
            className="text-[10px] font-bold text-black cursor-pointer hover:underline truncate max-w-[100px] hidden sm:inline"
          >
            {user.displayName}
          </span>

          <button
            onClick={handleLogout}
            className="p-1.5 hover:text-neon-magenta text-slate-600 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {/* Sign In Dropdown / Buttons */}
          <button
            onClick={() => handleLogin('google')}
            className="brutal-btn flex items-center space-x-1.5 px-3 py-1.5 text-[9px] uppercase hover:bg-neon-cyan font-bold"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In (Google)</span>
          </button>
          
          <button
            onClick={() => handleLogin('github')}
            className="brutal-btn flex items-center space-x-1.5 px-3 py-1.5 text-[9px] uppercase hover:bg-neon-orange hover:text-white font-bold hidden sm:flex"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Hacker Sign In</span>
          </button>
        </div>
      )}
    </div>
  );
}
