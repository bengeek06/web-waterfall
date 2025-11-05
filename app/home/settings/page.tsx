import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Company from "@/components/company";
import OrganizationTree from "@/components/organization-tree";
import { getDictionary } from "@/lib/dictionaries";
import { getLocale } from "@/lib/locale";
import { cookies } from "next/headers";
import { getCompanyIdFromToken } from "@/lib/user";
import { redirect } from "next/navigation";

export default async function CompanyPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  
  // Get company_id from token
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const companyId = getCompanyIdFromToken(token);
  
  if (!companyId) {
    redirect("/login");
  }

  return (
    <main>
      <div className="flex justify-center mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span>Entreprise</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
        <Company companyId={companyId} dictionary={dict.company} />
        <OrganizationTree companyId={companyId} dictionary={dict.organization} />
      </div>
    </main>
  );
}