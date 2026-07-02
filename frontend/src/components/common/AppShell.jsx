import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';

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
  const { t } = useLanguage();
  const layoutVariant = variant === 'jockey' ? 'owner' : variant;
  const shellClass = `${layoutVariant}-shell`;
  const sidebarClass = `${layoutVariant}-sidebar`;
  const brandClass = `${layoutVariant}-brand`;
  const logoClass = `${layoutVariant}-logo`;
  const navClass = `${layoutVariant}-nav`;
  const navItemClass = `${layoutVariant}-nav-item`;
  const profileClass = layoutVariant === 'owner' ? 'owner-profile-card' : 'admin-profile';
  const logoutClass = `${layoutVariant}-logout`;
  const mainClass = `${layoutVariant}-main`;
  const topbarClass = layoutVariant === 'owner' ? 'owner-topbar' : 'admin-header';

  return (
    <main className={shellClass}>
      <aside className={sidebarClass}>
        <div className={brandClass}>
          <div className={logoClass}>🏇</div>
          <div>
            <strong>Đường đua chiến thắng</strong>
            <span>
              {variant === 'owner'
                ? 'Cổng thông tin owner'
                : variant === 'jockey'
                  ? 'Cổng thông tin jockey'
                  : 'Bảng điều khiển quản trị'}
            </span>
          </div>
        </div>

        <nav className={navClass} aria-label={`${variant} navigation`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const label = item.labelKey ? t(item.labelKey) : item.label;
            return (
              <button
                key={item.key}
                className={activeSection === item.key ? `${navItemClass} active` : navItemClass}
                type="button"
                onClick={() => onNavigate?.(item.key)}
              >
                {typeof Icon === 'string' ? <span>{Icon}</span> : Icon ? <Icon size={18} aria-hidden="true" /> : null}
                {label}
              </button>
            );
          })}
        </nav>

        <div className={profileClass}>
          <span>Đăng nhập với tài khoản</span>
          <strong>{profileName}</strong>
          <small>{profileRole}</small>
        </div>

        <button className={logoutClass} type="button" onClick={onLogout}>
          {t('logout')}
        </button>
      </aside>

      <section className={mainClass}>
        <header className={topbarClass}>
          <div>
            <p className="eyebrow">
              {variant === 'owner'
                ? 'Bảng điều khiển owner'
                : variant === 'jockey'
                  ? 'Bảng điều khiển jockey'
                  : 'Admin'}
            </p>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            {headerAction}
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}
