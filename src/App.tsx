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
import { ShieldAlert, Lock, UserX } from 'lucide-react';

// Lazy-load non-critical drawers and modals for faster player initialization
const QueueDrawer = lazy(() => import('./components/QueueDrawer').then(m => ({ default: m.QueueDrawer })));
const PlaylistDrawer = lazy(() => import('./components/PlaylistDrawer').then(m => ({ default: m.PlaylistDrawer })));
const SearchModal = lazy(() => import('./components/SearchModal').then(m => ({ default: m.SearchModal })));
const KeyboardShortcutsModal = lazy(() => import('./components/KeyboardShortcutsModal').then(m => ({ default: m.KeyboardShortcutsModal })));
const LyricsDrawer = lazy(() => import('./components/LyricsDrawer').then(m => ({ default: m.LyricsDrawer })));
const AddContentModal = lazy(() => import('./components/AddContentModal').then(m => ({ default: m.AddContentModal })));
const SleepTimerModal = lazy(() => import('./components/SleepTimerModal').then(m => ({ default: m.SleepTimerModal })));
const LanguageSelectorModal = lazy(() => import('./components/LanguageSelectorModal').then(m => ({ default: m.LanguageSelectorModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const PaymentModal = lazy(() => import('./components/PaymentModal').then(m => ({ default: m.PaymentModal })));
const SubscriptionModal = lazy(() => import('./components/SubscriptionModal').then(m => ({ default: m.SubscriptionModal })));
const AdminModal = lazy(() => import('./components/AdminModal').then(m => ({ default: m.AdminModal })));
const SleepTimerOverlay = lazy(() => import('./components/SleepTimerOverlay').then(m => ({ default: m.SleepTimerOverlay })));

const AppContent: React.FC = () => {
  useKeyboardShortcuts();
  const { currentTrack, activeDrawer, isCurrentSessionBanned, userProfile, currentIp, currentHwid } = usePlayer();
  const bgRef = useAudioVisualizerBackground();

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased flex flex-col selection:bg-white selection:text-black relative overflow-hidden">
      {/* Banned Session Block Screen Overlay */}
      {isCurrentSessionBanned && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-950 border border-rose-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/50 space-y-5 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-500 text-white uppercase tracking-widest">
                ACCESS SUSPENDED
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                Account or Device Banned
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                Your account, IP address, or hardware device fingerprint has been restricted from accessing Sur Music due to platform terms violation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between text-neutral-400">
                <span>Account Status:</span>
                <span className="text-rose-400 font-bold">{userProfile?.isBanned ? 'BANNED' : 'BLOCKED'}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>IP Address:</span>
                <span className="text-amber-300 truncate max-w-[180px]">{currentIp || '127.0.0.1'}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Hardware ID:</span>
                <span className="text-amber-300 truncate max-w-[180px]">{currentHwid ? currentHwid.slice(0, 16) + '...' : 'HWID-DEVICE'}</span>
              </div>
              {userProfile?.banReason && (
                <div className="pt-2 border-t border-white/10 text-[11px] text-neutral-300">
                  <span className="text-neutral-500 block">Reason:</span>
                  <p className="italic text-rose-300 mt-0.5">{userProfile.banReason}</p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-neutral-500 leading-normal">
              If you believe this is an error, please contact the platform administrator to request an appeal or unban review.
            </p>
          </div>
        </div>
      )}

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

        {/* Enhanced Sleep Timer Floating HUD Overlay (5 mins or less) */}
        <Suspense fallback={null}>
          <SleepTimerOverlay />
        </Suspense>

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
          {activeDrawer === 'auth' && <AuthModal />}
          {activeDrawer === 'payment' && <PaymentModal />}
          {activeDrawer === 'subscription' && <SubscriptionModal />}
          {activeDrawer === 'admin' && <AdminModal />}
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
