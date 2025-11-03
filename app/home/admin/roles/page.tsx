import Roles from "@/components/roles";
import Policies from "@/components/policies";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getDictionary } from "@/lib/dictionaries";
import { getUserLanguage } from "@/lib/locale";

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
      <Roles dictionary={dictionary.roles} />
      <Policies dictionary={dictionary.policies} />
    </div>
  );
}