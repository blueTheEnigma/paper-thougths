import { 
  Megaphone, Palette, PenTool, CalendarHeart, 
  ShoppingBag, Settings, HelpCircle 
} from 'lucide-react';

export default function DepartmentBadge({ name, size = 'sm' }) {
  const getIcon = (deptName) => {
    const iconSize = size === 'sm' ? 12 : 14;
    switch (deptName?.toLowerCase()) {
      case 'marketing':
        return <Megaphone size={iconSize} />;
      case 'design':
        return <Palette size={iconSize} />;
      case 'content & editorial':
      case 'content':
      case 'editorial':
        return <PenTool size={iconSize} />;
      case 'events & community':
      case 'events':
      case 'community':
        return <CalendarHeart size={iconSize} />;
      case 'bookstore & sales':
      case 'bookstore':
      case 'sales':
        return <ShoppingBag size={iconSize} />;
      case 'operations':
        return <Settings size={iconSize} />;
      default:
        return <HelpCircle size={iconSize} />;
    }
  };

  const getColor = (deptName) => {
    switch (deptName?.toLowerCase()) {
      case 'marketing':
        return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
      case 'design':
        return 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20';
      case 'content & editorial':
      case 'content':
      case 'editorial':
        return 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20';
      case 'events & community':
      case 'events':
      case 'community':
        return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
      case 'bookstore & sales':
      case 'bookstore':
      case 'sales':
        return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20';
      case 'operations':
        return 'bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-sans font-bold uppercase tracking-wider border rounded-full ${getColor(name)} ${
      size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-xs'
    }`}>
      {getIcon(name)}
      <span>{name}</span>
    </span>
  );
}
