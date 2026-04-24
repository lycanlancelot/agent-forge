import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number;
  color?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, color = 'text-emerald-400' }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg bg-zinc-800/50 ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(trend)}% from yesterday</span>
        </div>
      )}
    </div>
  );
}
