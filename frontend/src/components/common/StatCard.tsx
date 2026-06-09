import { formatNumber } from '../../lib';

interface StatCardProps {
  label: string;
  value: unknown;
  description?: string;
  highlight?: boolean;
}

export default function StatCard({ label, value, description, highlight = false }: StatCardProps) {
  return (
    <div className={highlight ? 'owner-stat-card highlight' : 'owner-stat-card'}>
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
      {description && <small>{description}</small>}
    </div>
  );
}
