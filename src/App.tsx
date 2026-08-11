/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { Header } from './components/Header';
import { MainPlayer } from './components/MainPlayer';
import { LibrarySection } from './components/LibrarySection';
import { MiniPlayer } from './components/MiniPlayer';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAudioVisualizerBackground } from './hooks/useAudioVisualizerBackground';

// Lazy-load non-critical drawers and modals for faster player initialization
const QueueDrawer = lazy(() => import('./components/QueueDrawer').then(m => ({ default: m.QueueDrawer })));
const PlaylistDrawer = lazy(() => import('./components/PlaylistDrawer').then(m => ({ default: m.PlaylistDrawer })));
const SearchModal = lazy(() => import('./components/SearchModal').then(m => ({ default: m.SearchModal })));
const KeyboardShortcutsModal = lazy(() => import('./components/KeyboardShortcutsModal').then(m => ({ default: m.KeyboardShortcutsModal })));
const LyricsDrawer = lazy(() => import('./components/LyricsDrawer').then(m => ({ default: m.LyricsDrawer })));
const AddContentModal = lazy(() => import('./components/AddContentModal').then(m => ({ default: m.AddContentModal })));
const SleepTimerModal = lazy(() => import('./components/SleepTimerModal').then(m => ({ default: m.SleepTimerModal })));
const LanguageSelectorModal = lazy(() => import('./components/LanguageSelectorModal').then(m => ({ default: m.LanguageSelectorModal })));

const AppContent: React.FC = () => {
  useKeyboardShortcuts();
  const { currentTrack, activeDrawer } = usePlayer();
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

        {/* Lazy Loaded Drawers and Overlays */}
        <Suspense fallback={null}>
          {activeDrawer === 'queue' && <QueueDrawer />}
          {(activeDrawer === 'playlists' || activeDrawer === 'library') && <PlaylistDrawer />}
          {activeDrawer === 'search' && <SearchModal />}
          {activeDrawer === 'shortcuts' && <KeyboardShortcutsModal />}
          {activeDrawer === 'lyrics' && <LyricsDrawer />}
          {activeDrawer === 'addContent' && <AddContentModal />}
          {activeDrawer === 'sleep' && <SleepTimerModal />}
          {activeDrawer === 'language' && <LanguageSelectorModal />}
        </Suspense>

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
