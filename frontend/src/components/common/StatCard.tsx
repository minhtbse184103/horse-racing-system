import { formatNumber } from '../../lib';

export default function StatCard({ label, value, description, highlight = false }) {
  return (
    <div className={highlight ? 'owner-stat-card highlight' : 'owner-stat-card'}>
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
      {description && <small>{description}</small>}
    </div>
  );
}
