import Roles from "@/components/pages/RolesV2";
import Policies from "@/components/pages/PoliciesV2";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getDictionary } from "@/lib/utils/dictionaries";
import { getUserLanguage } from "@/lib/utils/locale";

export default async function RolesAdminPage() {
  const userLanguage = await getUserLanguage();
  const dictionary = await getDictionary(userLanguage);
  
  return (
    <div className="p-6 space-y-10">
      <div className="flex justify-center mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/home/admin">Administration</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span>{dictionary.roles.page_title}</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <Roles dictionary={{ ...dictionary.roles, errors: dictionary.errors }} />
      <Policies dictionary={{ ...dictionary.policies, errors: dictionary.errors }} />
    </div>
  );
}