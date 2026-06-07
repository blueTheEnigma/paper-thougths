import * as LucideIcons from 'lucide-react';

export default function StatCard({ 
  iconName, 
  label, 
  value, 
  trendText, 
  trendType = 'neutral', // 'up' (good), 'down' (bad), 'neutral'
  glowColor = '' // 'urgent', 'high', 'medium', etc.
}) {
  // Dynamically resolve the Lucide icon from its name string
  const IconComponent = LucideIcons[iconName] || LucideIcons.HelpCircle;

  const getTrendColor = () => {
    if (trendType === 'up') return 'text-green-600 bg-green-50 border-green-100';
    if (trendType === 'down') return 'text-red-600 bg-red-50 border-red-100';
    return 'text-gray-500 bg-gray-50 border-gray-100';
  };

  const getGlowClass = () => {
    if (glowColor === 'urgent') return 'metric-glow-urgent border-red-100';
    if (glowColor === 'high') return 'metric-glow-high border-orange-100';
    if (glowColor === 'medium') return 'metric-glow-medium border-blue-100';
    return '';
  };

  return (
    <div className={`parchment-card p-6 flex flex-col justify-between ${getGlowClass()}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50">{label}</p>
          <h3 className="font-display font-black text-2xl text-burgundy tracking-tight">{value}</h3>
        </div>
        <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-ink/5 text-burgundy/80 shadow-inner">
          <IconComponent size={20} className="stroke-[1.8px]" />
        </div>
      </div>
      
      {trendText && (
        <div className="mt-4 flex items-center">
          <span className={`inline-flex items-center text-[9px] font-sans font-extrabold uppercase tracking-widest border rounded px-1.5 py-0.5 ${getTrendColor()}`}>
            {trendText}
          </span>
        </div>
      )}
    </div>
  );
}
