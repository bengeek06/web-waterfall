import { getDictionary } from "@/lib/dictionaries";
import { getUserData } from "@/lib/user";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const dictionary = await getDictionary("fr"); // À remplacer par la locale dynamique si besoin
  const user = await getUserData();

  return (
    <ProfileForm dictionary={dictionary} user={user} />
  );
}