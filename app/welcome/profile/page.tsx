import { getDictionary } from "@/lib/dictionaries";
import { getUserData } from "@/lib/user";
import { getUserLanguage } from "@/lib/locale";
import Profile from "@/components/profile";

export default async function ProfilePage() {
  const userLanguage = await getUserLanguage();
  const dictionary = await getDictionary(userLanguage);
  const user = await getUserData();

  return (
    <Profile user={user} dictionary={dictionary} />
  );
}