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
import { ProtectedCard } from "@/components/shared/ProtectedCard";
import { PERMISSIONS } from "@/lib/utils/permissions";
import { testId, ADMIN_TEST_IDS } from "@/lib/test-ids";

interface AdminCardsProps {
  readonly dictionary: {
    readonly users: string;
    readonly manage_users: string;
    readonly roles: string;
    readonly manage_roles: string;
    readonly access: string;
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
        <Card {...testId(ADMIN_TEST_IDS.cards.usersCard)} className={`border-l-4 ${COLOR_CLASSES.border.waterfallUser} shadow-sm hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center gap-3">
            <Users className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallUser}`} />
            <CardTitle {...testId(ADMIN_TEST_IDS.cards.usersCardTitle)}>{dictionary.users}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/admin/users" className="w-full mt-2">
              <Button {...testId(ADMIN_TEST_IDS.cards.usersCardButton)} variant="outline" className="w-full">
                {dictionary.access}
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
        <Card {...testId(ADMIN_TEST_IDS.cards.rolesCard)} className={`border-l-4 ${COLOR_CLASSES.border.waterfallUser} shadow-sm hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center gap-3">
            <KeyRound className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallUser}`} />
            <CardTitle {...testId(ADMIN_TEST_IDS.cards.rolesCardTitle)}>{dictionary.roles}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/admin/roles" className="w-full mt-2">
              <Button {...testId(ADMIN_TEST_IDS.cards.rolesCardButton)} variant="outline" className="w-full">
                {dictionary.access}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </ProtectedCard>
    </div>
  );
}
