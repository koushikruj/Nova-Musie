import React, { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const LanguageSelectorModal: React.FC = () => {
  const { showToast } = usePlayer();
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const lang = localStorage.getItem('saloon_language');
    if (!lang) {
      setIsOpen(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleSelect = (lang: string) => {
    localStorage.setItem('saloon_language', lang);
    setIsOpen(false);
    showToast(`Language set to ${lang}`);
  };

  const languages = [
    { name: 'English', desc: 'Global hits & pop' },
    { name: 'Hindi', desc: 'Bollywood & Indie' },
    { name: 'Bengali', desc: 'Sunday Suspense, Bangla rock' },
    { name: 'Spanish', desc: 'Latin & Reggaeton' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-md bg-neutral-950/80 backdrop-blur-2xl border border-white/20 backdrop-saturate-150 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-white animate-in fade-in zoom-in duration-300">
        <div className="p-6 text-center border-b border-white/10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
            <Globe className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Choose Your Language</h2>
          <p className="text-sm text-neutral-400">
            Select your preferred content language to get started with Nova Music. You can change this later and add any content.
          </p>
        </div>
        <div className="p-4 space-y-2">
          {languages.map((lang) => (
            <button
              key={lang.name}
              onClick={() => handleSelect(lang.name)}
              className="w-full text-left p-4 rounded-xl bg-neutral-900/50 hover:bg-neutral-800 border border-white/5 hover:border-emerald-500/50 transition-all flex items-center justify-between group"
            >
              <div>
                <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{lang.name}</h3>
                <p className="text-xs text-neutral-500 mt-1">{lang.desc}</p>
              </div>
              <Check className="w-5 h-5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
