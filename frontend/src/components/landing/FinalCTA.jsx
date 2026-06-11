export default function FinalCTA({ onGoLogin, onGoRegister }) {
  return (
    <section className="bg-cream-100 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-4xl font-extrabold tracking-tight text-brown-900 sm:text-5xl">Ready for the Next Race?</h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-brown-900/70 sm:text-lg">
          Join owners, jockeys, admins and referees already running their tournaments on a single, premium platform.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={onGoRegister} className="rounded-md bg-brown-900 px-6 py-3 text-sm font-bold text-cream-100 shadow-sm transition hover:bg-brown-700">
            Create Account
          </button>
          <button type="button" onClick={onGoLogin} className="rounded-md border border-brown-900/20 bg-white px-6 py-3 text-sm font-bold text-brown-900 transition hover:bg-cream-200">
            Sign In
          </button>
        </div>
      </div>
    </section>
  );
}
