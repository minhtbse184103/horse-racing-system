export default function Button({ className = 'primary-button', type = 'button', children, ...props }) {
  return (
    <button className={className} type={type} {...props}>
      {children}
    </button>
  );
}
