import Link from "next/link";
import Image from "next/image";
import React from "react";

// UI Components
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// Utils
import { getAvatarUrl } from "@/lib/user";
import { getDictionary } from "@/lib/dictionaries";

// Constants
import { COMMON_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES, ICON_COLORS } from "@/lib/design-tokens";

// ==================== COMPONENT ====================
export default async function TopBar() {
  const avatarUrl = await getAvatarUrl();
  const dictionary = await getDictionary('fr');

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
            href="/welcome"
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
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    width={40}
                    height={40}
                    className={`object-cover ${ICON_SIZES.xl}`}
                    {...testId(COMMON_TEST_IDS.topBar.avatarImage)}
                  />
                ) : (
                  <span 
                    className={`${ICON_COLORS.waterfall} text-4xl`}
                    {...testId(COMMON_TEST_IDS.topBar.avatarIcon)}
                  >
                    👤
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end"
              {...testId(COMMON_TEST_IDS.topBar.dropdownContent)}
            >
              <DropdownMenuItem asChild>
                <Link 
                  href="/welcome/profile"
                  {...testId(COMMON_TEST_IDS.topBar.profileLink)}
                >
                  {dictionary.profile}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
