import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { UserManagement } from "@/components/admin/UserManagement";
import { getDictionary } from "@/lib/utils/dictionaries";
import { getUserLanguage } from "@/lib/utils/locale";

export default async function AdminUsersPage() {
  const userLanguage = await getUserLanguage();
  const dictionary = await getDictionary(userLanguage);

  return (
    <div>
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
              <span>{dictionary.users}</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <UserManagement dictionary={dictionary.admin_users} />
    </div>
  );
}
