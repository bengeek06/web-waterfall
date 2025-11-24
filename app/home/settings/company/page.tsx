/**
 * Copyright (c) 2025 Waterfall
 * 
 * This source code is dual-licensed under:
 * - GNU Affero General Public License v3.0 (AGPLv3) for open source use
 * - Commercial License for proprietary use
 * 
 * See LICENSE and LICENSE.md files in the root directory for full license text.
 * For commercial licensing inquiries, contact: benjamin@waterfall-project.pro
 */

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Company from "@/components/pages/Company";
import { getDictionary } from "@/lib/dictionaries";
import { getLocale } from "@/lib/locale";
import { cookies } from "next/headers";
import { getCompanyIdFromToken } from "@/lib/user";
import { redirect } from "next/navigation";

export default async function CompanyInfoPage() {
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
              <BreadcrumbLink href="/home/settings">Paramètres</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span>Informations de l&apos;entreprise</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="max-w-4xl mx-auto">
        <Company companyId={companyId} dictionary={dict.company} />
      </div>
    </main>
  );
}
