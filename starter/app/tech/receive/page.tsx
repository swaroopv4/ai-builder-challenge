export default function TechReceivePage() {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold">Receive (stub)</h1>
      <p className="text-gray-600 mt-2">
        Build the receive workflow here. A lab tech scans an incoming asset; if
        the tag is new, create it; if it&apos;s a duplicate with the same serial,
        treat it as idempotent; if serial mismatches, surface a clear error. See{" "}
        <code>docs/tips.md</code>.
      </p>
    </div>
  );
}
