import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[white] justify-center">
      <h1 className="text-6xl font-bold text-[black]">404</h1>
      <p className="mt-4 text-gray-500">
        Sorry, this page could not be found.
      </p>

      <Link
        href="/"
        className="mt-6 rounded bg-[black] px-4 py-2 text-white"
      >
        Return Home
      </Link>
    </div>
  );
}