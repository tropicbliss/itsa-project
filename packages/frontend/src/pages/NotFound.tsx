import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-auto flex-col justify-center px-6 py-24 sm:py-64 lg:px-8">
      <p className="text-base font-semibold leading-8">404</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-6 text-base leading-7">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <div className="mt-10">
        <Link to="/" className="text-sm font-semibold leading-7">
          <span aria-hidden="true">&larr;</span> Back to home
        </Link>
      </div>
    </main>
  );
}
