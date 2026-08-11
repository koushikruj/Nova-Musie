/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerProvider } from './context/PlayerContext';
import { Header } from './components/Header';
import { MainPlayer } from './components/MainPlayer';
import { QueueDrawer } from './components/QueueDrawer';
import { PlaylistDrawer } from './components/PlaylistDrawer';
import { SearchModal } from './components/SearchModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { LyricsDrawer } from './components/LyricsDrawer';
import { AddContentModal } from './components/AddContentModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { Toast } from './components/Toast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePlayer } from './context/PlayerContext';
import { useAudioVisualizerBackground } from './hooks/useAudioVisualizerBackground';
import { LibrarySection } from './components/LibrarySection';
import { MiniPlayer } from './components/MiniPlayer';
import { Footer } from './components/Footer';

const AppContent: React.FC = () => {
  useKeyboardShortcuts();
  const { currentTrack } = usePlayer();
  const bgRef = useAudioVisualizerBackground();

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased flex flex-col selection:bg-white selection:text-black relative overflow-hidden">
      {/* Ambient Blurred Background */}
      {currentTrack?.albumArt && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-55 overflow-hidden">
          <img 
            ref={bgRef}
            src={currentTrack.albumArt} 
            alt="ambient" 
            className="w-full h-full object-cover blur-[80px] scale-125 saturate-150 transform-gpu"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black" />
        </div>
      )}
      
      {/* Ensure content sits above ambient background */}
      <div className="relative z-10 flex flex-col min-h-screen overflow-y-auto">
        {/* Nova Header Bar */}
        <Header />

        {/* Main Nova Artwork-First Player Container */}
        <MainPlayer />

        {/* Library Section (Scrollable) */}
        <LibrarySection />

        {/* Copyright Footer */}
        <Footer />

        {/* Floating Mini Player */}
        <MiniPlayer />

      {/* Drawers and Overlays */}
      <QueueDrawer />
      <PlaylistDrawer />
      <SearchModal />
      <KeyboardShortcutsModal />
      <LyricsDrawer />
      <AddContentModal />
      <SleepTimerModal />
      <LanguageSelectorModal />

      {/* Quick Feedback Toast */}
      <Toast />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
}
