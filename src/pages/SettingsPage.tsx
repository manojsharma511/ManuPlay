import React, { useState } from 'react';
import { Volume2, Vibrate, Sliders, Trash2, User, Check, Shield } from 'lucide-react';
import { storageService, type UserPreferences } from '../services/StorageService';
import { userService } from '../services/UserService';
import { audioService } from '../services/AudioService';
import { Button } from '../components/common/Button';
import { SEO } from '../components/common/SEO';

export const SettingsPage: React.FC = () => {
  const [prefs, setPrefs] = useState<UserPreferences>(() => storageService.getPreferences());
  const [profile, setProfile] = useState(() => userService.getProfile());
  const [savedToast, setSavedToast] = useState(false);

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    const updated = storageService.savePreferences({ [key]: value });
    setPrefs(updated);
    audioService.updateVolumes();
    triggerToast();
  };

  const triggerToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleClearSaves = () => {
    if (confirm('Are you sure you want to clear all local game saves, high scores, and favorites?')) {
      localStorage.clear();
      setPrefs(storageService.getPreferences());
      setProfile(userService.getProfile());
      alert('Local storage data cleared.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <SEO
        title="Platform Settings"
        description="Manage audio, haptics, graphics, and local preferences."
        path="/settings"
        noindex={true}
      />
      
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">Platform Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Manage audio, haptics, graphics, and local guest preferences.</p>
      </div>

      {/* Toast Notification */}
      {savedToast && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" /> Preferences saved automatically!
        </div>
      )}

      {/* Guest Profile Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center text-slate-950 font-black text-lg">
            <User className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white">{profile.username}</h3>
              <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-cyan-500/20 text-cyan-400 uppercase">
                GUEST
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {profile.gamesPlayedCount} Games Played • Total Score: {profile.totalScore.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Section: Audio Controls */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-400" /> Audio & Sound Effects
        </h3>

        {/* Master Mute */}
        <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
          <div>
            <span className="font-semibold text-sm text-slate-200">Mute All Audio</span>
            <p className="text-xs text-slate-400">Silences master game volume and music</p>
          </div>
          <button
            onClick={() => updatePreference('muted', !prefs.muted)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${prefs.muted ? 'bg-red-500' : 'bg-slate-700'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${prefs.muted ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Music Volume */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>Music Volume</span>
            <span>{Math.round(prefs.musicVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={prefs.musicVolume}
            onChange={(e) => updatePreference('musicVolume', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* SFX Volume */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>SFX Volume</span>
            <span>{Math.round(prefs.sfxVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={prefs.sfxVolume}
            onChange={(e) => updatePreference('sfxVolume', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Settings Section: Haptics & Feedback */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <Vibrate className="w-4 h-4 text-purple-400" /> Haptics & Vibration
        </h3>

        <div className="flex items-center justify-between py-2">
          <div>
            <span className="font-semibold text-sm text-slate-200">Haptic Vibration</span>
            <p className="text-xs text-slate-400">Triggers gentle vibration feedback on mobile collisions & buttons</p>
          </div>
          <button
            onClick={() => updatePreference('haptics', !prefs.haptics)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${prefs.haptics ? 'bg-cyan-400' : 'bg-slate-700'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${prefs.haptics ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Settings Section: Graphics & Performance */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" /> Graphics Quality & Motion
        </h3>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Graphics Quality Preset</label>
          <div className="grid grid-cols-4 gap-2">
            {(['auto', 'low', 'medium', 'high'] as const).map(quality => (
              <button
                key={quality}
                onClick={() => updatePreference('graphicsQuality', quality)}
                className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                  prefs.graphicsQuality === quality
                    ? 'bg-cyan-400 text-slate-950 shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {quality}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Storage & Clear Data */}
      <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-3">
        <h3 className="font-bold text-sm text-red-400 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4" /> Data & Save Storage
        </h3>
        <p className="text-xs text-slate-400">
          All high scores, unlocked progress, and favorited games are preserved locally in your browser's IndexedDB storage.
        </p>
        <Button variant="danger" size="sm" onClick={handleClearSaves}>
          <Trash2 className="w-4 h-4 mr-2" /> Clear All Local Data
        </Button>
      </div>

    </div>
  );
};
