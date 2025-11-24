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

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { User, LogOut, Info } from "lucide-react";

// UI Components
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import LogoutButton from "@/components/shared/LogoutButton";
import AboutModal from "@/components/modals/about-modal";
import ProfileModal from "@/components/modals/profile-modal";
import AvatarImage from "@/components/shared/AvatarImage";

// Utils
import { getUserData } from "@/lib/server/user";
import { getDictionary } from "@/lib/utils/dictionaries";
import { getUserLanguage } from "@/lib/utils/locale";

// Constants
import { COMMON_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES, ICON_COLORS } from "@/lib/design-tokens";

// ==================== COMPONENT ====================
export default async function TopBar() {
  const userData = await getUserData();
  const userLanguage = await getUserLanguage();
  const dictionary = await getDictionary(userLanguage);
  const userId = userData?.id;

  // ==================== RENDER ====================
  return (
    <nav 
      className="w-full bg-waterfall-accent pl-4 py-3 mb-6 shadow"
      {...testId(COMMON_TEST_IDS.topBar.nav)}
    >
      <div className="flex items-center gap-6 w-full">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link 
            href="/home"
            {...testId(COMMON_TEST_IDS.topBar.logoLink)}
          >
            <Image
              src="/waterfall_logo.svg"
              alt="Waterfall Logo"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
              {...testId(COMMON_TEST_IDS.topBar.logo)}
            />
          </Link>
        </div>
        
        <div className="flex-1" />
        
        {/* Avatar Dropdown */}
        <div className="pr-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className={`rounded-full overflow-hidden border border-waterfall-icon bg-white ${ICON_SIZES.xl} flex items-center justify-center`}
                {...testId(COMMON_TEST_IDS.topBar.avatarButton)}
              >
                {userId ? (
                  <AvatarImage
                    userId={userId}
                    hasAvatar={userData?.has_avatar || false}
                    size={40}
                    className={`object-cover ${ICON_SIZES.xl}`}
                    iconSize={24}
                    iconColor={ICON_COLORS.waterfall}
                    testId={testId(COMMON_TEST_IDS.topBar.avatarImage)}
                  />
                ) : (
                  <User 
                    size={24}
                    className={ICON_COLORS.waterfall}
                    {...testId(COMMON_TEST_IDS.topBar.avatarIcon)}
                  />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end"
              className="w-48"
              {...testId(COMMON_TEST_IDS.topBar.dropdownContent)}
            >
              <DropdownMenuItem asChild>
                <ProfileModal
                  className="flex items-center gap-3 w-full text-left cursor-pointer px-3 py-2"
                  testId={COMMON_TEST_IDS.topBar.profileLink}
                  dictionary={dictionary}
                  userInfo={userData ? {
                    id: userData.id,
                    firstName: userData.first_name,
                    lastName: userData.last_name,
                    email: userData.email,
                    phoneNumber: userData.phone_number,
                    language: userData.language
                  } : undefined}
                >
                  <User size={16} className="text-gray-500" />
                  <span>{dictionary.profile}</span>
                </ProfileModal>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <AboutModal
                  className="flex items-center gap-3 w-full text-left cursor-pointer px-3 py-2"
                  testId={COMMON_TEST_IDS.topBar.aboutLink}
                >
                  <Info size={16} className="text-gray-500" />
                  <span>{dictionary.about}</span>
                </AboutModal>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <LogoutButton
                  className="flex items-center gap-3 w-full text-left cursor-pointer px-3 py-2 text-red-600 hover:text-red-700"
                  testId={COMMON_TEST_IDS.topBar.logoutLink}
                >
                  <LogOut size={16} />
                  <span>{dictionary.logout}</span>
                </LogoutButton>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
