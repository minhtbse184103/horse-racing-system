/**
 * Button component
 * Props:
 *   variant: 'primary' | 'secondary' | 'outline' | 'text' | 'danger'
 *   loading: boolean
 *   children, onClick, type, disabled, className, ...rest
 */
export default function Button({
  variant = 'primary',
  loading = false,
  children,
  className = '',
  disabled,
  ...rest
}) {
  const variantClass = {
    primary: 'primary-button',
    secondary: 'secondary-button',
    outline: 'outline-button',
    text: 'text-button',
    danger: 'danger-action',
  }[variant] || 'primary-button';

  return (
    <button
      className={`${variantClass} ${className}`.trim()}
      disabled={loading || disabled}
      {...rest}
    >
      {loading ? 'Đang xử lý...' : children}
    </button>
  );
}
