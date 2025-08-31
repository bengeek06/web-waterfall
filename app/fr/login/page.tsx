import Image from "next/image";
import { getDictionary } from "@/lib/dictionaries";
import Login from "@/components/login";

export default async function Home() {
  const dictionary = await getDictionary('fr')


  return (
    <div className="flex min-h-screen flex-col items-center p-12">
      <Image
        src="/fr/waterfall_logo.png"
        alt="Waterfall Logo"
        width={400}
        height={104}
        priority
      />
      <p className="mt-4 text-lg text-gray-600">
        {dictionary.description}
      </p>
      <div className="mt-0 w-full max-w-sm">
        <Login dictionary={dictionary.login_component} />
      </div>
    </div>
  );
}
