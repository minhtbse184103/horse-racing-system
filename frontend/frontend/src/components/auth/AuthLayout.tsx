import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="page-shell">
      <section className="hero-panel" aria-hidden="true">
        <div className="brand-pill">Equestrian Tournament</div>
        <h1>Horse Racing Management System</h1>
        <p>Đăng nhập để quản lý giải đua, ngựa, chủ ngựa và các nghiệp vụ trong hệ thống.</p>
      </section>

      {children}
    </main>
  );
}
