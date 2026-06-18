import { cn } from '../../lib/classNames.js';

export default function Card({ children, className = '', title, description, action }) {
  return (
    <section className={cn('rounded-3xl border border-slate-100 bg-white p-6 shadow-soft', className)}>
      {(title || description || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h2 className="text-lg font-bold text-slate-950">{title}</h2>}
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
