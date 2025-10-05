import InitApp from "@/components/initApp";
import { getDictionary } from "@/lib/dictionaries";

export default async function InitAppPage() {
  const dictionary = await getDictionary("fr");
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <InitApp dictionary={dictionary.init_app} />
    </div>
  );
}
