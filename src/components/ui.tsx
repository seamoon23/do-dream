import { CircleHelp, X } from 'lucide-react';
import type { GuideKey } from '../lib/content';
import { guideContent } from '../lib/content';

export function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function inputClass(extra = '') {
  return classNames(
    'w-full rounded-2xl border border-ink/12 bg-white/95 px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink/35 focus:border-moss focus:ring-4 focus:ring-reed/20',
    extra,
  );
}

export function AppButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const { variant = 'ghost', className, ...rest } = props;
  return (
    <button
      {...rest}
      className={classNames(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-ink text-white hover:bg-moss',
        variant === 'ghost' && 'border border-ink/15 bg-white/80 text-ink hover:bg-cloud',
        variant === 'danger' && 'border border-clay/25 bg-white/85 text-clay hover:bg-clay/10',
        className,
      )}
    />
  );
}

export function Field(props: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-ink">
      <span>{props.label}</span>
      {props.children}
      {props.hint ? <span className="text-xs font-medium text-ink/55">{props.hint}</span> : null}
    </label>
  );
}

export function EmptyState(props: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-ink/15 bg-white/70 p-8 text-center">
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-cloud text-moss">{props.icon}</div>
      <p className="text-base font-bold text-ink">{props.title}</p>
      <p className="mt-1 max-w-lg text-sm leading-6 text-ink/62">{props.body}</p>
      {props.action ? <div className="mt-4">{props.action}</div> : null}
    </div>
  );
}

export function SectionIntro(props: { guideKey: GuideKey; onGuide: (key: GuideKey) => void }) {
  const guide = guideContent[props.guideKey];
  return (
    <div className="mb-4 rounded-3xl border border-ink/10 bg-cloud/65 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black">{guide.title}</h3>
          <p className="mt-1 text-sm leading-6 text-ink/65">{guide.summary}</p>
        </div>
        <AppButton onClick={() => props.onGuide(props.guideKey)}>
          <CircleHelp size={16} /> Guide
        </AppButton>
      </div>
    </div>
  );
}

export function GuideDialog(props: { guideKey?: GuideKey; onClose: () => void }) {
  if (!props.guideKey) return null;
  const guide = guideContent[props.guideKey];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-md bg-paper p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-moss">Guide</p>
            <h2 className="mt-1 text-2xl font-black">{guide.title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/66">{guide.summary}</p>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-white" onClick={props.onClose} aria-label="닫기">
            <X size={17} />
          </button>
        </div>
        <div className="mt-5 grid gap-3">
          {guide.bullets.map((bullet, index) => (
            <div key={bullet} className="grid grid-cols-[32px_1fr] gap-3 rounded-md border border-ink/10 bg-white p-3">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-cloud text-sm font-black text-moss">{index + 1}</span>
              <p className="text-sm leading-6 text-ink/70">{bullet}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Metric(props: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-cloud px-3 py-2">
      <p className="text-xs font-bold text-ink/50">{props.label}</p>
      <p className="text-lg font-black">{props.value}</p>
    </div>
  );
}

export function BriefCard(props: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-cloud/70 p-4">
      <p className="text-xs font-black text-moss">{props.title}</p>
      <p className="mt-2 text-sm leading-6 text-ink/68">{props.body}</p>
    </div>
  );
}

export function ProgressCard(props: { title: string; value: string; body: string; onClick: () => void }) {
  return (
    <button onClick={props.onClick} className="rounded-3xl border border-ink/10 bg-white/85 p-5 text-left transition hover:border-moss hover:bg-cloud/60">
      <p className="text-xs font-black uppercase tracking-wide text-moss">{props.title}</p>
      <p className="mt-2 text-3xl font-black">{props.value}</p>
      <p className="mt-2 text-sm text-ink/60">{props.body}</p>
    </button>
  );
}
