import { useState, useCallback } from 'react';

const SUPPORTED_LANGS = {
  en: 'en-IN',
  kn: 'kn-IN',
};

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text, langCode) => {
    const speechLang = SUPPORTED_LANGS[langCode];
    if (!speechLang || !window.speechSynthesis) return false;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
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

  const isSupported = (langCode) => langCode in SUPPORTED_LANGS;

  return { speak, stop, speaking, isSupported };
}
