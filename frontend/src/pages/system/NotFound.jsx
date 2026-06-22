import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F5F5F5] px-4">
      <div className="max-w-md rounded-[2rem] bg-white p-8 text-center shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#D4AF37]">404</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">The requested route does not exist in the mock frontend.</p>
        <Link to="/dashboard" className="btn btn-primary mt-6 inline-flex">
          Return Dashboard
        </Link>
      </div>
    </main>
  );
}
