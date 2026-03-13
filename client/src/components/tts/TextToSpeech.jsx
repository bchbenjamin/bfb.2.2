import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS.js';
import Button from '../ui/Button.jsx';

export default function TextToSpeech({ text }) {
  const { t, i18n } = useTranslation();
  const { speak, stop, speaking, isSupported } = useTTS();
  const lang = i18n.language;

  if (!isSupported(lang)) {
    return <p className="text-xs text-on-surface-variant italic">{t('tts.unsupported')}</p>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => speaking ? stop() : speak(text, lang)}
    >
      {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
      {speaking ? t('tts.stop') : t('tts.speak')}
    </Button>
  );
}
