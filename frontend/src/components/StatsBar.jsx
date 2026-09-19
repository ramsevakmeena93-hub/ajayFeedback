import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";

const CARDS = [
  { key:"total",     label:"Total Reports", icon:FileText,    color:"text-indigo-600",  bg:"bg-indigo-50",  border:"border-indigo-100" },
  { key:"processed", label:"Processed",     icon:CheckCircle, color:"text-emerald-600", bg:"bg-emerald-50", border:"border-emerald-100" },
  { key:"pending",   label:"Pending",       icon:Clock,       color:"text-amber-600",   bg:"bg-amber-50",   border:"border-amber-100"   },
  { key:"errors",    label:"Errors",        icon:AlertCircle, color:"text-red-600",     bg:"bg-red-50",     border:"border-red-100"     },
];

export default function StatsBar({ stats }) {
  if (!stats || stats.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} className={`card-hover p-4 border ${s.border} animate-fade-in`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                {Icon && <Icon size={18} className={s.color} />}
              </div>
            </div>
            <p className={`text-2xl font-bold ${s.color} leading-none mb-1`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
          </div>
        )
      })}
    </div>
  );
}
