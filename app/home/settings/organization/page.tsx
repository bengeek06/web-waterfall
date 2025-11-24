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
import OrganizationTree from "@/components/pages/OrganizationTree";
import { getDictionary } from "@/lib/utils/dictionaries";
import { getLocale } from "@/lib/utils/locale";
import { cookies } from "next/headers";
import { getCompanyIdFromToken } from "@/lib/server/user";
import { redirect } from "next/navigation";

export default async function OrganizationPage() {
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
              <span>Structure organisationnelle</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="max-w-6xl mx-auto">
        <OrganizationTree companyId={companyId} dictionary={dict.organization} />
      </div>
    </main>
  );
}
