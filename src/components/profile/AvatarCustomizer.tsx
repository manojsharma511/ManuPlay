import React, { useState } from 'react';
import { User, Check } from 'lucide-react';
import { userService, type UserProfile } from '../../services/UserService';
import { Button } from '../common/Button';

const AVATAR_GRADIENTS = [
  'from-cyan-400 to-purple-600',
  'from-pink-500 to-rose-600',
  'from-amber-400 to-orange-600',
  'from-emerald-400 to-teal-600',
  'from-purple-600 to-indigo-600'
];

export const AvatarCustomizer: React.FC<{ onUpdated?: () => void }> = ({ onUpdated }) => {
  const [profile, setProfile] = useState<UserProfile>(() => userService.getProfile());
  const [username, setUsername] = useState(profile.username);
  const [selectedGradient, setSelectedGradient] = useState(AVATAR_GRADIENTS[0]);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      const updated = userService.saveProfile({ username: username.trim() });
      setProfile(updated);
      setSaved(true);
      if (onUpdated) onUpdated();
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <form onSubmit={handleSave} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${selectedGradient} flex items-center justify-center text-slate-950 shadow-lg shrink-0`}>
          <User className="w-8 h-8 text-slate-950" />
        </div>
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-bold text-slate-300">GUEST PLAYER USERNAME</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-400">AVATAR FRAME GRADIENT</label>
        <div className="flex items-center gap-2">
          {AVATAR_GRADIENTS.map((grad) => (
            <button
              key={grad}
              type="button"
              onClick={() => setSelectedGradient(grad)}
              className={`w-8 h-8 rounded-full bg-gradient-to-tr ${grad} transition-transform ${selectedGradient === grad ? 'scale-110 ring-2 ring-cyan-400' : 'opacity-60'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        {saved ? (
          <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
            <Check className="w-4 h-4" /> Profile Updated!
          </span>
        ) : <span />}

        <Button type="submit" variant="primary" size="sm">
          Save Profile
        </Button>
      </div>
    </form>
  );
};
