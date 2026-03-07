import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login – Sound For Ears",
};

export default function LoginPage({ searchParams }) {
  const error =
    typeof searchParams?.error === "string"
      ? decodeURIComponent(searchParams.error)
      : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-3 py-6 sm:px-4 sm:py-10">
      <div className="w-full max-w-md rounded-2xl bg-white/90 px-4 py-6 shadow-lg ring-1 ring-slate-200/80 sm:rounded-3xl sm:px-8 sm:py-10">
        <div className="mb-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
            Sound For Ears
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Clinic Login
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in as clinic admin, staff or patient.
          </p>
        </div>
        <div className="mt-4">
          <LoginForm error={error} />
        </div>
      </div>
    </main>
  );
}


