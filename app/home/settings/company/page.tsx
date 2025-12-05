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

import PageBreadcrumb from "@/components/shared/PageBreadcrumb";
import Company from "@/components/pages/Company";
import { getDictionary } from "@/lib/utils/dictionaries";
import { getLocale } from "@/lib/utils/locale";
import { cookies } from "next/headers";
import { getCompanyIdFromToken } from "@/lib/server/user";
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
      <PageBreadcrumb
        pathname="/home/settings/company"
        dictionary={dict.breadcrumb}
        siblings={[
          { label: dict.breadcrumb.company, href: "/home/settings/company" },
          { label: dict.breadcrumb.customers, href: "/home/settings/customers" },
          { label: dict.breadcrumb.subcontractors, href: "/home/settings/subcontractors" },
          { label: dict.breadcrumb.organization, href: "/home/settings/organization" },
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <Company companyId={companyId} dictionary={dict.company} />
      </div>
    </main>
  );
}
