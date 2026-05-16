import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Asset operations</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-950">
          Asset tracking command center
        </h1>
        <p className="mt-3 max-w-3xl text-gray-600">
          Technicians can scan asset movements quickly, while managers can review
          asset state, recent movement, and reconciliation issues across Operations,
          Facilities, and Finance.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">
            Technician workflows
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Receive, store, deploy, and transfer assets with scanner-first workflows.
          </p>

          <ul className="mt-5 space-y-2">
            <li>
              <Link className="text-blue-700 hover:underline" href="/tech">
                Open technician launcher
              </Link>
            </li>
            <li>
              <Link className="text-blue-700 hover:underline" href="/tech/receive">
                Receive asset
              </Link>
            </li>
            <li>
              <Link className="text-blue-700 hover:underline" href="/tech/store">
                Store asset
              </Link>
            </li>
            <li>
              <Link className="text-blue-700 hover:underline" href="/tech/deploy">
                Deploy asset
              </Link>
            </li>
            <li>
              <Link className="text-blue-700 hover:underline" href="/tech/transfer">
                Transfer custody
              </Link>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">
            Manager workflows
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Review asset state, recent movement, and Operations / Facilities /
            Finance drift from an exception-first view.
          </p>

          <ul className="mt-5 space-y-2">
            <li>
              <Link className="text-blue-700 hover:underline" href="/manager">
                Open manager dashboard
              </Link>
            </li>
            <li>
              <Link className="text-blue-700 hover:underline" href="/manager/reconcile">
                Review reconciliation report
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-950">
          What this app is optimized for
        </h2>
        <div className="mt-3 grid gap-3 text-sm text-gray-700 md:grid-cols-3">
          <p>
            <span className="font-medium text-gray-950">Fast scans:</span>{" "}
            focused technician flows that support repeated scanner input.
          </p>
          <p>
            <span className="font-medium text-gray-950">Clean handoffs:</span>{" "}
            server-side writebacks keep Operations, Facilities, and Finance aligned.
          </p>
          <p>
            <span className="font-medium text-gray-950">Actionable review:</span>{" "}
            reconciliation explains what needs attention instead of dumping raw diffs.
          </p>
        </div>
      </section>

      <section className="text-sm text-gray-500">
        <Link
          className="text-blue-700 hover:underline"
          href="https://github.com/swaroopv4/ai-builder-challenge"
          target="_blank"
          rel="noreferrer"
        >
          View GitHub repository
        </Link>
      </section>
    </div>
  );
}