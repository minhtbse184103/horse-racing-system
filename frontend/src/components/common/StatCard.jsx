import { formatNumber } from '../../lib';

export default function StatCard({ label, value, description, highlight = false }) {
  const displayValue = typeof value === 'number' ? formatNumber(value) : value ?? '0';

  return (
    <div className={highlight ? 'owner-stat-card highlight' : 'owner-stat-card'}>
      <span>{label}</span>
      <strong>{displayValue}</strong>
      {description && <small>{description}</small>}
    </div>
  );
}
