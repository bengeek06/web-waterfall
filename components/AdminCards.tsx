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
import { KeyRound, Users } from "lucide-react";
import Link from "next/link";
import { COLOR_CLASSES, ICON_SIZES } from "@/lib/design-tokens";
import { ProtectedCard } from "@/components/ProtectedCard";
import { PERMISSIONS } from "@/lib/permissions";

interface AdminCardsProps {
  readonly dictionary: {
    readonly users: string;
    readonly manage_users: string;
    readonly roles: string;
    readonly manage_roles: string;
  };
}

export function AdminCards({ dictionary }: AdminCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {/* Card Users - Protected */}
      <ProtectedCard 
        requirements={[[PERMISSIONS.IDENTITY_USER_LIST]]}
        loadingBehavior="hide"
      >
        <Card className={`border-l-4 ${COLOR_CLASSES.border.waterfallUser} shadow-sm hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center gap-3">
            <Users className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallUser}`} />
            <CardTitle>{dictionary.users}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/admin/users" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                Accéder
              </Button>
            </Link>
          </CardContent>
        </Card>
      </ProtectedCard>

      {/* Card Roles - Protected */}
      <ProtectedCard 
        requirements={[[PERMISSIONS.GUARDIAN_ROLE_LIST]]}
        loadingBehavior="hide"
      >
        <Card className={`border-l-4 ${COLOR_CLASSES.border.waterfallUser} shadow-sm hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center gap-3">
            <KeyRound className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallUser}`} />
            <CardTitle>{dictionary.roles}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/admin/roles" className="w-full mt-2">
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
