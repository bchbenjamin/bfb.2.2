import { getCategoryInfo } from '../../utils/categories.js';

export default function CategoryChart({ categories }) {
  if (!categories?.length) return null;

  const max = Math.max(...categories.map(c => c.count));

  return (
    <div className="space-y-2">
      {categories.map(cat => {
        const info = getCategoryInfo(cat.ai_category);
        const pct = max > 0 ? (cat.count / max) * 100 : 0;
        return (
          <div key={cat.ai_category} className="flex items-center gap-3">
            <span className="text-lg w-6 text-center">{info.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-0.5">
                <span className="text-on-surface">{cat.ai_category || 'Unknown'}</span>
                <span className="text-on-surface-variant font-medium">{cat.count}</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: info.color }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
