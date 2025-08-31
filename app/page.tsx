import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <Image
        src="/waterfall_logo.png"
        alt="Waterfall Logo"
        width={1178}
        height={307}
      />
    </div>
  );
}
