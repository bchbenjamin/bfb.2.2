import { useState, useCallback, useEffect, useRef } from 'react';

const SUPPORTED_LANGS = {
  en: 'en-IN',
  kn: 'kn-IN',
};

// Tulu and Konkani fall back to English TTS
const FALLBACK_LANGS = {
  tcy: 'en-IN',
  kok: 'en-IN',
};

/**
 * Hover-to-read TTS hook.
 * When enabled, reads aloud whatever element the user hovers over.
 */
export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const langRef = useRef('en');

  const speak = useCallback((text, langCode) => {
    const speechLang = SUPPORTED_LANGS[langCode] || FALLBACK_LANGS[langCode];
    if (!speechLang || !window.speechSynthesis || !text?.trim()) return false;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = speechLang;
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
    return true;
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const toggle = useCallback((langCode) => {
    if (enabled) {
      stop();
      setEnabled(false);
    } else {
      langRef.current = langCode || 'en';
      setEnabled(true);
    }
  }, [enabled, stop]);

  // Attach hover listeners when enabled
  useEffect(() => {
    if (!enabled) return;

    function handleMouseOver(e) {
      const el = e.target;
      // Only read elements with direct text, not containers
      const text = el.textContent?.trim();
      if (!text || text.length > 500) return;
      // Skip if the element has many children (it's a container, not a leaf)
      if (el.children.length > 3) return;
      // Prefer reading leaf-level text nodes
      const useLang = ['tcy', 'kok'].includes(langRef.current) ? 'en' : langRef.current;
      const speechLang = SUPPORTED_LANGS[useLang] || FALLBACK_LANGS[useLang] || 'en-IN';
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLang;
      utterance.rate = 0.95;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }

    document.addEventListener('mouseover', handleMouseOver);
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    };
  }, [enabled]);

  const isSupported = (langCode) => langCode in SUPPORTED_LANGS || langCode in FALLBACK_LANGS;

  return { speak, stop, speaking, enabled, toggle, isSupported };
}
