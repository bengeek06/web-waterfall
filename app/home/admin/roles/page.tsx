import Roles from "@/components/pages/RolesV2";
import Policies from "@/components/pages/PoliciesV2";
import PageBreadcrumb from "@/components/shared/PageBreadcrumb";
import { getDictionary } from "@/lib/utils/dictionaries";
import { getUserLanguage } from "@/lib/utils/locale";

export default async function RolesAdminPage() {
  const userLanguage = await getUserLanguage();
  const dictionary = await getDictionary(userLanguage);
  
  return (
    <div className="p-6 space-y-10">
      <PageBreadcrumb
        pathname="/home/admin/roles"
        dictionary={dictionary.breadcrumb}
        siblings={[
          { label: dictionary.breadcrumb.users, href: "/home/admin/users" },
          { label: dictionary.breadcrumb.roles, href: "/home/admin/roles" },
        ]}
      />
      <Roles dictionary={{ ...dictionary.roles, errors: dictionary.errors }} />
      <Policies dictionary={{ ...dictionary.policies, errors: dictionary.errors }} />
    </div>
  );
}