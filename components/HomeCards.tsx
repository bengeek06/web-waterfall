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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Building2, FolderKanban } from "lucide-react";
import Link from "next/link";
import { COLOR_CLASSES, ICON_SIZES } from "@/lib/design-tokens";
import { ProtectedCard } from "@/components/ProtectedCard";
import { PERMISSION_REQUIREMENTS } from "@/lib/permissions";

interface HomeCardsProps {
  readonly dictionary: {
    readonly administration: string;
    readonly access_administration: string;
    readonly company: string;
    readonly access_company: string;
    readonly projects: string;
    readonly access_projects: string;
  };
}

export function HomeCards({ dictionary }: HomeCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {/* Card Users Administration - Protected */}
      <ProtectedCard 
        requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}
        loadingBehavior="hide"
      >
        <Card className={`border-l-4 ${COLOR_CLASSES.border.waterfallUser} shadow-sm hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center gap-3">
            <ShieldCheck className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallUser}`} />
            <CardTitle>{dictionary.administration}</CardTitle>
          </CardHeader>
                    <CardContent>
            <Link href="/home/admin" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                Accéder
              </Button>
            </Link>
          </CardContent>
        </Card>
      </ProtectedCard>

      {/* Card Company Settings - Protected */}
      <ProtectedCard 
        requirements={PERMISSION_REQUIREMENTS.COMPANY_SETTINGS}
        loadingBehavior="hide"
      >
        <Card className={`border-l-4 ${COLOR_CLASSES.border.waterfallCompany} shadow-sm hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center gap-3">
            <Building2 className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallCompany}`} />
            <CardTitle>{dictionary.company}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/settings" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                Accéder
              </Button>
            </Link>
          </CardContent>
        </Card>
      </ProtectedCard>

      {/* Card Projects - Always visible for now */}
      <Card className={`border-l-4 ${COLOR_CLASSES.border.waterfallProject} shadow-sm hover:shadow-md transition-shadow`}>
        <CardHeader className="flex flex-row items-center gap-3">
          <FolderKanban className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallProject}`} />
          <CardTitle>{dictionary.projects}</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/home/projects" className="w-full mt-2">
            <Button variant="outline" className="w-full">
              Accéder
            </Button>
          </Link>
          </CardContent>
          <CardHeader className="flex flex-row items-center gap-3">
            <Building2 className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallCompany}`} />
            <CardTitle>{dictionary.company}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/settings" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                {dictionary.access_company}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </ProtectedCard>

      {/* Card Projects - Always visible for now */}
      <Card className={`border-l-4 ${COLOR_CLASSES.border.waterfallProject} shadow-sm hover:shadow-md transition-shadow`}>
        <CardHeader className="flex flex-row items-center gap-3">
          <FolderKanban className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallProject}`} />
          <CardTitle>{dictionary.projects}</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/home/projects" className="w-full mt-2">
            <Button variant="outline" className="w-full">
              {dictionary.access_projects}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
