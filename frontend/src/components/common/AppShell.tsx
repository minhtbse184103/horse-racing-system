export default function AppShell({
  variant = 'owner',
  title,
  subtitle,
  profileName,
  profileRole,
  activeSection,
  navItems = [],
  onNavigate,
  onLogout,
  children,
  headerAction
}) {
  const shellClass = `${variant}-shell`;
  const sidebarClass = `${variant}-sidebar`;
  const brandClass = `${variant}-brand`;
  const logoClass = `${variant}-logo`;
  const navClass = `${variant}-nav`;
  const navItemClass = `${variant}-nav-item`;
  const profileClass = variant === 'owner' ? 'owner-profile-card' : 'admin-profile';
  const logoutClass = `${variant}-logout`;
  const mainClass = `${variant}-main`;
  const topbarClass = variant === 'owner' ? 'owner-topbar' : 'admin-header';

  return (
    <main className={shellClass}>
      <aside className={sidebarClass}>
        <div className={brandClass}>
          <div className={logoClass}>🏇</div>
          <div>
            <strong>Trackside Triumph</strong>
            <span>{variant === 'owner' ? 'Owner Portal' : 'Admin Dashboard'}</span>
          </div>
        </div>

        <nav className={navClass} aria-label={`${variant} navigation`}>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={activeSection === item.key ? `${navItemClass} active` : navItemClass}
              type="button"
              onClick={() => onNavigate?.(item.key)}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </nav>

        <div className={profileClass}>
          <span>Đang đăng nhập</span>
          <strong>{profileName}</strong>
          <small>{profileRole}</small>
        </div>

        <button className={logoutClass} type="button" onClick={onLogout}>
          Đăng xuất
        </button>
      </aside>

      <section className={mainClass}>
        <header className={topbarClass}>
          <div>
            <p className="eyebrow">{variant === 'owner' ? 'Owner Dashboard' : 'Admin'}</p>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {headerAction}
        </header>

        {children}
      </section>
    </main>
  );
}
