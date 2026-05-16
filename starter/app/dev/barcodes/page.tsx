const CODE128 = [
  "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
  "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
  "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
  "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
  "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
  "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
  "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
  "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
  "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
  "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
  "114131","311141","411131","211412","211214","211232","2331112",
];

const ITEMS = [
  { label: "Asset C0009001", value: "C0009001" },
  { label: "Asset C0009002", value: "C0009002" },
  { label: "Interesting asset C0000101", value: "C0000101" },
  { label: "Interesting asset C0000420", value: "C0000420" },
  { label: "Badge tech-jane", value: "tech-jane" },
  { label: "Badge tech-mike", value: "tech-mike" },
  { label: "Badge manager-paul", value: "manager-paul" },
  { label: "Receiving location", value: "Irvine/Receiving" },
  { label: "Storage no RU", value: "Irvine/Storage A" },
  { label: "Deploy missing RU", value: "site=Irvine;room=B12;rack=R4" },
  { label: "Deploy full rack", value: "site=Irvine;room=B12;rack=R4;ru=12" },
  { label: "JSON deploy", value: '{"site":"Irvine","room":"B12","rack":"R4","ru":"12"}' },
];

export default function DevBarcodesPage() {
  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold">Printable scan labels</h1>
        <p className="mt-1 text-sm text-gray-600">
          Code 128 labels for assets, badges, and location payloads used by the scan parser.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item) => (
          <div key={`${item.label}-${item.value}`} className="break-inside-avoid rounded-lg border bg-white p-4 text-center">
            <div className="text-sm font-semibold">{item.label}</div>
            <Barcode value={item.value} />
            <div className="mt-2 font-mono text-sm">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Barcode({ value }: { value: string }) {
  const bars = encodeCode128(value);
  const width = bars.reduce((sum, bar) => sum + bar.width, 0) * 2 + 20;
  return (
    <svg role="img" aria-label={`Barcode for ${value}`} viewBox={`0 0 ${width} 90`} className="mx-auto mt-3 h-24 w-full max-w-[320px]">
      <rect width={width} height="90" fill="white" />
      {bars.map((bar, index) =>
        bar.on ? <rect key={index} x={bar.x * 2 + 10} y="10" width={bar.width * 2} height="62" fill="black" /> : null,
      )}
    </svg>
  );
}

function encodeCode128(value: string): { x: number; width: number; on: boolean }[] {
  const codes = [...value].map((char) => {
    const code = char.charCodeAt(0) - 32;
    if (code < 0 || code > 94) throw new Error("Code 128 label contains unsupported characters.");
    return code;
  });
  const checksum = (104 + codes.reduce((sum, code, index) => sum + code * (index + 1), 0)) % 103;
  const sequence = [104, ...codes, checksum, 106];
  let x = 0;
  const bars: { x: number; width: number; on: boolean }[] = [];
  for (const code of sequence) {
    const pattern = CODE128[code] ?? "";
    [...pattern].forEach((digit, index) => {
      const width = Number(digit);
      bars.push({ x, width, on: index % 2 === 0 });
      x += width;
    });
  }
  return bars;
}
