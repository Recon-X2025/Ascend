import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-display font-extrabold text-[clamp(6rem,20vw,12rem)] text-white/20 leading-none select-none">
        404
      </p>
      <h1 className="font-display font-bold text-[1.4rem] text-white mt-4">
        Page not found
      </h1>
      <p className="font-body text-[0.9rem] text-white/70 mt-2 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or was moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-green text-white font-body font-medium px-6 py-3 hover:bg-green-dark transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
