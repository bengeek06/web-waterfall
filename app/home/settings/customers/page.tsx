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
import Customers from "@/components/pages/Customers";
import { getDictionary } from "@/lib/utils/dictionaries";
import { getLocale } from "@/lib/utils/locale";

export default async function CustomersPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <main>
      <PageBreadcrumb
        pathname="/home/settings/customers"
        dictionary={dict.breadcrumb}
        siblings={[
          { label: dict.breadcrumb.company, href: "/home/settings/company" },
          { label: dict.breadcrumb.customers, href: "/home/settings/customers" },
          { label: dict.breadcrumb.subcontractors, href: "/home/settings/subcontractors" },
          { label: dict.breadcrumb.organization, href: "/home/settings/organization" },
        ]}
      />
      <div className="max-w-6xl mx-auto">
        <Customers 
          dictionary={dict.customers} 
          commonTable={dict.common_table}
          logoUpload={dict.logo_upload}
        />
      </div>
    </main>
  );
}
