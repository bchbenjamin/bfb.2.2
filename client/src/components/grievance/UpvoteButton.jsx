import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { apiFetch } from '../../api/client.js';
import Button from '../ui/Button.jsx';

export default function UpvoteButton({ grievanceId, impactCount, onUpdate }) {
  const { t } = useTranslation();
  const [count, setCount] = useState(impactCount);
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false);

  async function handleUpvote() {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/grievances/${grievanceId}/upvote`, { method: 'POST' });
      setCount(data.impact_count);
      setVoted(true);
      if (data.already_upvoted) setVoted(true);
      onUpdate?.(data.impact_count);
    } catch (err) {
      console.error('Upvote failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={voted ? 'filled' : 'outlined'}
      size="md"
      onClick={handleUpvote}
      disabled={loading || voted}
      className="w-full"
    >
      <Users size={18} />
      {voted ? t('grievance.impact_count', { count }) : t('grievance.affected_too')}
      {!voted && <span className="ml-1 font-bold">({count})</span>}
    </Button>
  );
}
