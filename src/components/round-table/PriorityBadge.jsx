import { AlertCircle, Clock, Info, ShieldAlert } from 'lucide-react';

export default function PriorityBadge({ priority, size = 'sm' }) {
  const getIcon = (level) => {
    const iconSize = size === 'sm' ? 10 : 12;
    switch (level?.toLowerCase()) {
      case 'urgent':
        return <ShieldAlert size={iconSize} />;
      case 'high':
        return <AlertCircle size={iconSize} />;
      case 'medium':
        return <Clock size={iconSize} />;
      case 'low':
      default:
        return <Info size={iconSize} />;
    }
  };

  const getColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'medium':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'low':
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 font-sans font-extrabold uppercase tracking-widest border rounded ${getColor(priority)} ${
      size === 'sm' ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[10px]'
    }`}>
      {getIcon(priority)}
      <span>{priority}</span>
    </span>
  );
}
