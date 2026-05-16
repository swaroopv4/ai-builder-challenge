import Link from "next/link";

export default function TechLandingPage() {
  const workflows = [
    {
      href: "/tech/receive",
      title: "Receive",
      body: "Create an incoming asset from tag, serial, model, and receiving location.",
    },
    {
      href: "/tech/store",
      title: "Store",
      body: "Move received or in-service assets into storage without requiring a rack unit.",
    },
    {
      href: "/tech/deploy",
      title: "Deploy",
      body: "Put an asset into service with a full rack and RU, then sync downstream systems.",
    },
    {
      href: "/tech/transfer",
      title: "Transfer",
      body: "Hand custody to another badge while keeping the asset in its current state.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tech scan workflows</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Keep the scan field focused. USB and Bluetooth scanners can type into
          each workflow and press Enter; touch controls are sized for quick
          recovery when a scan needs to be corrected.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {workflows.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg border bg-white p-5 shadow-sm hover:border-blue-500"
          >
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{item.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
