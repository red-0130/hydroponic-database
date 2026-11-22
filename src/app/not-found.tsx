import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-5xl">
        404 - Crop Not Found
      </h1>
      <p className="mt-4 text-base text-neutral-600 dark:text-neutral-400 max-w-md">
        The plant or page you are looking for does not exist in our hydroponic database or has been removed.
      </p>
      <div className="mt-8">
        <Link
          href="/"
          data-testid="back-to-directory-link"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Crop Directory
        </Link>
      </div>
    </main>
  );
}
