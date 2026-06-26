import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur', className)}>
      {children}
    </section>
  );
}

export function Button({ children, className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const styles = {
    primary: 'border-tech-neon bg-tech-neon text-black hover:bg-lime-300',
    secondary: 'border-white/15 bg-white/[0.08] text-white hover:border-tech-neon/60 hover:text-tech-neon',
    danger: 'border-red-400/40 bg-red-500/15 text-red-100 hover:bg-red-500/25',
    ghost: 'border-transparent bg-transparent text-zinc-300 hover:bg-white/[0.08] hover:text-white',
  }[variant];
  return (
    <button
      className={cx('inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50', styles, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="min-h-11 rounded-md border border-white/10 bg-black/40 px-3 text-white placeholder:text-zinc-500" {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="min-h-11 rounded-md border border-white/10 bg-black/40 px-3 text-white" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="min-h-24 rounded-md border border-white/10 bg-black/40 px-3 py-3 text-white placeholder:text-zinc-500" {...props} />;
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-normal', className)}>{children}</span>;
}

export function Stat({ label, value, tone = 'neutral' }: { label: string; value: string | number; tone?: 'neutral' | 'neon' | 'warn' | 'danger' }) {
  const toneClass = tone === 'neon' ? 'text-tech-neon' : tone === 'warn' ? 'text-yellow-200' : tone === 'danger' ? 'text-red-200' : 'text-white';
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className={cx('mt-2 text-2xl font-black', toneClass)}>{value}</p>
    </Card>
  );
}
