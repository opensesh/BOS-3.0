'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useSplash } from '@/lib/splash-context';
import { easings } from '@/lib/motion';

const VIDEO_SRC = '/assets/extra/BOS Logo_CRT Glow 2.mp4';
const FADE_DURATION = 0.6;
const MIN_DISPLAY_TIME = 2000;

export function DailySplash() {
  const { isShowingSplash, completeSplash, skipSplash } = useSplash();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track when splash actually starts showing
  useEffect(() => {
    if (isShowingSplash && videoReady) {
      startTimeRef.current = Date.now();
    }
  }, [isShowingSplash, videoReady]);

  const triggerExit = useCallback(() => {
    setIsExiting(true);
  }, []);

  const handleVideoEnd = useCallback(() => {
    // Ensure minimum display time
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    setTimeout(() => {
      triggerExit();
    }, remaining);
  }, [triggerExit]);

  const handleExitComplete = useCallback(() => {
    completeSplash();
    setIsExiting(false);
    setVideoReady(false);
  }, [completeSplash]);

  const handleVideoError = useCallback(() => {
    console.error('Splash video failed to load');
    setVideoError(true);
    setTimeout(() => {
      completeSplash();
    }, 500);
  }, [completeSplash]);

  const handleCanPlay = useCallback(() => {
    setVideoReady(true);
    videoRef.current?.play().catch(console.error);
  }, []);

  const handleClick = useCallback(() => {
    skipSplash();
  }, [skipSplash]);

  if (!mounted) return null;

  const shouldRender = isShowingSplash && !isExiting && !videoError;

  const splashContent = (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {shouldRender && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_DURATION, ease: easings.easeOut }}
          onClick={handleClick}
          className="fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: '#000000' }}
        >
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            muted
            playsInline
            preload="auto"
            onCanPlay={handleCanPlay}
            onEnded={handleVideoEnd}
            onError={handleVideoError}
            className="object-contain"
            style={{
              maxWidth: '60vw',
              maxHeight: '60vh',
              opacity: videoReady ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(splashContent, document.body);
}
