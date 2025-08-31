import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <Image
        src="/fr/waterfall_logo.png"
        alt="Waterfall Logo"
        width={1178}
        height={307}
        priority
      />
      <h1 className="mt-4 text-2xl font-bold">Bienvenue sur Waterfall</h1>
      <p className="mt-2 text-lg text-gray-600">
        Une application de gestion de projet qui permet aux utilisateurs de gérer
        efficacement les projets, les jalons et les livrables.
      </p>
      <p className="mt-2 text-lg text-gray-600">
        LOG_LEVEL is set to: {process.env.LOG_LEVEL || "info"}
      </p>
    </div>
  );
}
