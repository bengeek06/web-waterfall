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

"use client";

import Link from "next/link";
import { Building2, Network, Users, Briefcase } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProtectedCard } from "@/components/shared/ProtectedCard";
import { PERMISSION_REQUIREMENTS } from "@/lib/utils/permissions";
import { ICON_SIZES, COLOR_CLASSES } from "@/lib/design-tokens";

type SettingsDictionary = {
  company_info_title?: string;
  company_info_description?: string;
  company_info_button?: string;
  organization_title?: string;
  organization_description?: string;
  organization_button?: string;
  customers_title?: string;
  customers_description?: string;
  customers_button?: string;
  subcontractors_title?: string;
  subcontractors_description?: string;
  subcontractors_button?: string;
};

export default function SettingsCards({ dictionary }: { readonly dictionary: SettingsDictionary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
      {/* Informations de l'entreprise */}
      <ProtectedCard
        requirements={PERMISSION_REQUIREMENTS.COMPANY_INFO}
        loadingBehavior="hide"
      >
        <Card className={`border-l-4 ${COLOR_CLASSES.border.waterfallCompany} shadow-sm hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center gap-3">
            <Building2 className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallCompany}`} />
            <CardTitle>
              {dictionary.company_info_title || "Informations de l'entreprise"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/settings/company" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                Accéder
              </Button>
            </Link>
          </CardContent>
        </Card>
      </ProtectedCard>

      {/* Structure organisationnelle */}
      <ProtectedCard
        requirements={PERMISSION_REQUIREMENTS.ORGANIZATION_STRUCTURE}
        loadingBehavior="hide"
      >
        <Card className={`border-l-4 ${COLOR_CLASSES.border.waterfallCompany} shadow-sm hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center gap-3">
            <Network className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallCompany}`} />
            <CardTitle>
              {dictionary.organization_title || "Structure organisationnelle"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/settings/organization" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                Accéder
              </Button>
            </Link>
          </CardContent>
        </Card>
      </ProtectedCard>

      {/* Clients */}
      <ProtectedCard
        requirements={PERMISSION_REQUIREMENTS.CUSTOMERS_MANAGEMENT}
        loadingBehavior="hide"
      >
        <Card className={`border-l-4 ${COLOR_CLASSES.border.waterfallCompany} shadow-sm hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center gap-3">
            <Users className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallCompany}`} />
            <CardTitle>
              {dictionary.customers_title || "Clients"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/settings/customers" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                Accéder
              </Button>
            </Link>
          </CardContent>
        </Card>
      </ProtectedCard>

      {/* Sous-traitants */}
      <ProtectedCard
        requirements={PERMISSION_REQUIREMENTS.SUBCONTRACTORS_MANAGEMENT}
        loadingBehavior="hide"
      >
        <Card className={`border-l-4 ${COLOR_CLASSES.border.waterfallCompany} shadow-sm hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center gap-3">
            <Briefcase className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallCompany}`} />
            <CardTitle>
              {dictionary.subcontractors_title || "Sous-traitants"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/settings/subcontractors" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                Accéder
              </Button>
            </Link>
          </CardContent>
        </Card>
      </ProtectedCard>
    </div>
  );
}
