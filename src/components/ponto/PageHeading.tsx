import type { ReactNode } from "react";

export function PageHeading({ eyebrow, title, desc, children }: { eyebrow: string; title: string; desc?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-card">
      {title && <div className="mb-4 flex items-center justify-between gap-2"><h2 className="font-bold">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}
