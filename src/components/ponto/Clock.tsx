import { useNow } from "@/lib/queries";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Clock({ big = false, className }: { big?: boolean; className?: string }) {
  const now = useNow();
  const { idioma } = useT();
  const hora = now ? now.toLocaleTimeString(idioma) : "--:--:--";
  const data = now
    ? now.toLocaleDateString(idioma, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    : "";
  if (big)
    return (
      <div className={cn("text-center", className)}>
        <div className="tabular text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl" aria-live="off">
          {hora}
        </div>
        <div className="mt-1 text-sm capitalize text-muted-foreground">{data}</div>
      </div>
    );
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="hidden text-xs capitalize text-muted-foreground md:inline">{data}</span>
      <span className="tabular rounded-lg bg-secondary px-3 py-1.5 text-sm font-bold text-secondary-foreground">{hora}</span>
    </div>
  );
}
