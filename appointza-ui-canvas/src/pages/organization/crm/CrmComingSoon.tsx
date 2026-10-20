import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

type Props = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

/** Placeholder for CRM screens planned but not yet built. */
export default function CrmComingSoon({ title, description, icon: Icon = Construction }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 overflow-y-auto px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold text-appointza-navy">{title}</h2>
      <p className="max-w-md text-sm leading-relaxed text-stone-500">{description}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Coming soon</p>
    </div>
  );
}
