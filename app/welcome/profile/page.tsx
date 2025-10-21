import { getDictionary } from "@/lib/dictionaries";
import { getUserData } from "@/lib/user";
import { getUserLanguage } from "@/lib/locale";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const userLanguage = await getUserLanguage();
  const dictionary = await getDictionary(userLanguage);
  const user = await getUserData();

  return (
    <ProfileForm dictionary={dictionary} user={user} />
  );
}