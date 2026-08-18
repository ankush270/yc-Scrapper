import React, { useState, useEffect } from 'react';
import { 
  Trophy, Medal, Target, Flame, 
  Award, Shield, Sparkles, User, RefreshCw 
} from 'lucide-react';
import { subscribeToAuth, getAuthHeader } from '../lib/firebase';

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState([]);
  const [user, setUser] = useState(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const header = getAuthHeader();
      const res = await fetch('/api/leaderboard/weekly', {
        headers: { 'Authorization': header }
      });
      if (res.ok) {
        const data = await res.json();
        setBoard(data);
      }
    } catch (e) {
      console.error("Error fetching weekly leaderboard:", e);
      // Fallback simulated builders if fetch fails
      setBoard([
        { uid: "mock1", displayName: "ByteCoder_0x", photoURL: "", score: 850, streak: 12, badgesCount: 6, isCurrentUser: false },
        { uid: "mock2", displayName: "SaaS_Founder_AI", photoURL: "", score: 690, streak: 8, badgesCount: 4, isCurrentUser: false },
        { uid: "mock3", displayName: "CS_Student_MIT", photoURL: "", score: 520, streak: 5, badgesCount: 3, isCurrentUser: false },
        { uid: "mock4", displayName: "IndieHackerPro", photoURL: "", score: 410, streak: 4, badgesCount: 3, isCurrentUser: false },
        { uid: "mock5", displayName: "YCCurator", photoURL: "", score: 380, streak: 6, badgesCount: 2, isCurrentUser: false },
        { uid: "mock6", displayName: "StartupVibe", photoURL: "", score: 290, streak: 3, badgesCount: 2, isCurrentUser: false },
        { uid: "mock7", displayName: "You (Builder)", photoURL: "", score: 120, streak: 1, badgesCount: 1, isCurrentUser: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuth((u) => {
      setUser(u);
    });
    fetchLeaderboard();
    return () => unsubscribe();
  }, []);

  // Split board into Podium (Top 3) and standard List (Ranks 4+)
  const podium = board.slice(0, 3);
  const listRows = board.slice(3);

  // Position colors for podium cards
  const podiumStyles = [
    { border: 'border-neon-orange shadow-[6px_6px_0px_0px_#ff7700]', labelBg: 'bg-neon-orange text-white', rank: '1st', icon: <Trophy className="w-6 h-6 text-neon-orange animate-bounce" /> },
    { border: 'border-neon-cyan shadow-[6px_6px_0px_0px_#00bce6]', labelBg: 'bg-neon-cyan text-black', rank: '2nd', icon: <Medal className="w-6 h-6 text-neon-cyan" /> },
    { border: 'border-neon-magenta shadow-[6px_6px_0px_0px_#e60073]', labelBg: 'bg-neon-magenta text-white', rank: '3rd', icon: <Medal className="w-6 h-6 text-neon-magenta" /> }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header and Sync Control */}
      <div className="flex justify-between items-center border-b-2 border-black pb-4">
        <div>
          <h2 className="font-mono-tech text-lg md:text-xl font-black uppercase text-black tracking-wider flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-neon-orange fill-neon-orange/20" />
            Builder Arena Weekly
          </h2>
          <p className="font-mono-code text-[10px] text-slate-500 uppercase mt-0.5">
            Compete with students, founders, and techies globally
          </p>
        </div>
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="brutal-btn p-2 bg-white hover:bg-zinc-50"
          title="Refresh rankings"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="brutal-card p-12 text-center bg-white">
          <RefreshCw className="w-8 h-8 text-neon-cyan animate-spin mx-auto mb-3" />
          <span className="font-mono-tech text-xs uppercase font-extrabold tracking-wider">RETRIEVING LEADERBOARD STATS...</span>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3">
            {podium.map((builder, idx) => {
              const style = podiumStyles[idx] || podiumStyles[2];
              return (
                <div 
                  key={builder.uid}
                  className={`brutal-card p-5 bg-white relative flex flex-col justify-between items-center text-center transition-all hover:-translate-y-1 ${style.border} ${
                    builder.isCurrentUser ? 'ring-2 ring-black bg-neon-cyan/5' : ''
                  }`}
                >
                  {/* Rank Flag */}
                  <span className={`absolute top-3 left-3 text-[9px] font-mono-tech font-black px-2 py-0.5 rounded border border-black uppercase ${style.labelBg}`}>
                    Rank {style.rank}
                  </span>

                  {/* Icon / Avatar placeholder */}
                  <div className="mt-4 mb-3 flex flex-col items-center">
                    <div className="mb-2">{style.icon}</div>
                    <div className="w-14 h-14 rounded-full border-2 border-black bg-zinc-50 flex items-center justify-center overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {builder.photoURL ? (
                        <img src={builder.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-mono-tech text-sm font-black uppercase text-black max-w-[150px] truncate">
                      {builder.displayName} {builder.isCurrentUser && '(You)'}
                    </h3>
                    
                    <div className="flex items-center justify-center space-x-3 text-[10px] font-mono-code font-bold">
                      <span className="text-neon-orange flex items-center">
                        <Flame className="w-3.5 h-3.5 fill-current mr-0.5" />
                        {builder.streak}d
                      </span>
                      <span className="text-neon-magenta flex items-center">
                        <Award className="w-3.5 h-3.5 mr-0.5" />
                        {builder.badgesCount}
                      </span>
                    </div>
                  </div>

                  {/* Score Box */}
                  <div className="mt-5 w-full bg-black text-white border-2 border-black rounded py-1.5 font-mono-tech text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {builder.score} POINTS
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ranks 4-10 List */}
          <div className="space-y-2">
            <span className="font-mono-code text-[10px] uppercase font-bold text-slate-500 block mb-2.5">
              Arena Contenders (Ranks 4-10)
            </span>

            {listRows.map((builder, idx) => {
              const rankNum = idx + 4;
              return (
                <div 
                  key={builder.uid}
                  className={`brutal-card p-3 bg-white flex items-center justify-between transition-all hover:bg-slate-50 ${
                    builder.isCurrentUser 
                      ? 'border-neon-cyan shadow-[3px_3px_0px_0px_#00bce6] bg-neon-cyan/5' 
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Rank Badge */}
                    <span className="w-6 h-6 rounded border border-black bg-zinc-100 flex items-center justify-center font-mono-tech text-xs font-black">
                      {rankNum}
                    </span>

                    {/* Avatar monogram */}
                    <div className="w-7 h-7 rounded-full border border-black bg-zinc-50 flex items-center justify-center overflow-hidden">
                      {builder.photoURL ? (
                        <img src={builder.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-mono-tech text-xs font-bold">{builder.displayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <span className="font-mono-tech text-xs font-extrabold uppercase text-black">
                      {builder.displayName} {builder.isCurrentUser && '(You)'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-6">
                    {/* Stats */}
                    <div className="hidden sm:flex items-center space-x-4 text-[9px] font-mono-code font-bold text-slate-700">
                      <span className="flex items-center">
                        <Flame className="w-3 h-3 text-neon-orange fill-current mr-0.5" />
                        {builder.streak} Streak
                      </span>
                      <span className="flex items-center">
                        <Award className="w-3 h-3 text-neon-magenta mr-0.5" />
                        {builder.badgesCount} Badges
                      </span>
                    </div>

                    {/* Score */}
                    <span className="font-mono-tech text-xs font-black bg-black text-white px-2.5 py-1 rounded border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide">
                      {builder.score} PTS
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gamification rules footer */}
          <div className="brutal-card p-5 bg-white border-dashed text-slate-800 space-y-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="font-mono-tech text-xs font-black uppercase text-black flex items-center">
              <Sparkles className="w-4 h-4 text-neon-orange mr-1.5 animate-pulse" />
              How Points are Calculated
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono-code text-[9px] font-bold text-slate-700">
              <li className="flex items-center">
                <Target className="w-3.5 h-3.5 mr-1.5 text-neon-cyan shrink-0" />
                <span>Startup Views: 5 pts each</span>
              </li>
              <li className="flex items-center">
                <Target className="w-3.5 h-3.5 mr-1.5 text-neon-orange shrink-0" />
                <span>Daily Streak Check-in: 15 pts</span>
              </li>
              <li className="flex items-center">
                <Target className="w-3.5 h-3.5 mr-1.5 text-neon-magenta shrink-0" />
                <span>Unlocked Badges: 50 pts each</span>
              </li>
            </ul>
          </div>

        </div>
      )}

    </div>
  );
}
