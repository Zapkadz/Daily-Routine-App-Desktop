import { Activity, BookOpen, Droplets, Heart, Moon, Sparkles } from 'lucide-react';
import { usePreferencesStore } from '../stores/preferencesStore';

const builtins = { sparkles: Sparkles, book: BookOpen, activity: Activity, droplets: Droplets, moon: Moon, heart: Heart };
export function RoutineIcon({ icon, color }: { icon: string | null; color: string }) {
  const options = usePreferencesStore(state => state.value.icons);
  const option = options.find(item => item.id === icon);
  const Icon = builtins[icon as keyof typeof builtins];
  return <span className="routine-icon" style={{ color, backgroundColor: `${color}18` }} aria-hidden="true">
    {Icon ? <Icon size={18} /> : option?.symbol ?? <Sparkles size={18} />}
  </span>;
}
