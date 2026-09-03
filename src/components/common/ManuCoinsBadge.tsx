import React, { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import { manuCoinsService } from '../../services/ManuCoinsService';

export const ManuCoinsBadge: React.FC = () => {
  const [balance, setBalance] = useState(() => manuCoinsService.getBalance());

  useEffect(() => {
    const updateBalance = () => {
      setBalance(manuCoinsService.getBalance());
    };
    window.addEventListener('storage', updateBalance);
    const interval = setInterval(updateBalance, 2000);
    return () => {
      window.removeEventListener('storage', updateBalance);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wide shadow-sm hover:scale-105 transition-transform select-none">
      <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
      <span>{balance.toLocaleString()}</span>
    </div>
  );
};
