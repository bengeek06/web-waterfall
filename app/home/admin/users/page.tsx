import PageBreadcrumb from "@/components/shared/PageBreadcrumb";
import UsersV2 from "@/components/pages/UsersV2";
import { getDictionary } from "@/lib/utils/dictionaries";
import { getUserLanguage } from "@/lib/utils/locale";

export default async function AdminUsersPage() {
  const userLanguage = await getUserLanguage();
  const dictionary = await getDictionary(userLanguage);

  return (
    <div>
      <PageBreadcrumb
        pathname="/home/admin/users"
        dictionary={dictionary.breadcrumb}
        siblings={[
          { label: dictionary.breadcrumb.users, href: "/home/admin/users" },
          { label: dictionary.breadcrumb.roles, href: "/home/admin/roles" },
        ]}
      />
      <UsersV2 dictionary={dictionary.admin_users} />
    </div>
  );
}
