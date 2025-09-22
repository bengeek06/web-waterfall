import Link from "next/link";
import Image from "next/image";
import React from "react";
import { getAvatarUrl } from "@/lib/user";
import { UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { getDictionary } from "@/lib/dictionaries";

export default async function TopBar() {
  const avatarUrl = await getAvatarUrl();
  const dictionary = await getDictionary('fr');

  return (
    <nav className="w-full bg-waterfall-accent pl-4 py-3 mb-6 shadow">
      <div className="flex items-center gap-6 w-full">
        <div className="flex-shrink-0">
          <Link href="/welcome">
            <Image
              src="/waterfall_logo.svg"
              alt="Waterfall Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>
        <div className="flex-1" />
        {/* Avatar à droite */}
        <div className="pr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full overflow-hidden border border-waterfall-icon bg-white w-10 h-10 flex items-center justify-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="object-cover w-10 h-10"
                />
              ) : (
                <span className="text-waterfall-icon text-4xl">👤</span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/welcome/profile">{dictionary.profile}</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
