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

import React from "react";
import { ChevronDown } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PAGE_BREADCRUMB_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES } from "@/lib/design-tokens";
import { useRouter } from "next/navigation";

export type BreadcrumbSibling = {
  label: string;
  href: string;
};

export type PageBreadcrumbProps = {
  /**
   * Current pathname (e.g., "/home/admin/users")
   */
  pathname: string;

  /**
   * Breadcrumb dictionary with path segment translations
   * e.g., { home: "Home", admin: "Administration", users: "Users" }
   */
  dictionary: Record<string, string>;

  /**
   * Optional siblings for dropdown menu on current page
   * e.g., [{ label: "Users", href: "/home/admin/users" }, { label: "Roles", href: "/home/admin/roles" }]
   */
  siblings?: BreadcrumbSibling[];
};

/**
 * PageBreadcrumb - Breadcrumb navigation component
 *
 * Features:
 * - Auto-generates breadcrumb from pathname
 * - Internationalization support via dictionary
 * - Optional dropdown menu for sibling pages
 * - Full accessibility and test-id support
 *
 * @example
 * ```tsx
 * <PageBreadcrumb
 *   pathname="/home/admin/users"
 *   dictionary={dictionary.breadcrumb}
 *   siblings={[
 *     { label: "Users", href: "/home/admin/users" },
 *     { label: "Roles", href: "/home/admin/roles" }
 *   ]}
 * />
 * ```
 */
export default function PageBreadcrumb({
  pathname,
  dictionary,
  siblings,
}: PageBreadcrumbProps) {
  const router = useRouter();

  // Parse pathname into breadcrumb items
  const segments = pathname.split('/').filter(Boolean);
  const items = segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`;
    const label = dictionary[segment] || segment;
    const isLast = index === segments.length - 1;

    return {
      segment,
      label,
      href: path,
      isLast,
    };
  });

  const handleSiblingClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="flex justify-center mb-4" {...testId(PAGE_BREADCRUMB_TEST_IDS.container)}>
      <Breadcrumb>
        <BreadcrumbList {...testId(PAGE_BREADCRUMB_TEST_IDS.list)}>
          {items.map((item) => (
            <React.Fragment key={item.segment}>
              <BreadcrumbItem {...testId(`${PAGE_BREADCRUMB_TEST_IDS.item}-${item.segment}`)}>
                {item.isLast ? (
                  siblings && siblings.length > 0 ? (
                    // Last item with siblings - show dropdown
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="flex items-center gap-1"
                        {...testId(PAGE_BREADCRUMB_TEST_IDS.dropdownTrigger)}
                      >
                        <span {...testId(PAGE_BREADCRUMB_TEST_IDS.currentItem)}>
                          {item.label}
                        </span>
                        <ChevronDown className={ICON_SIZES.xs} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        {...testId(PAGE_BREADCRUMB_TEST_IDS.dropdownContent)}
                      >
                        {siblings.map((sibling) => (
                          <DropdownMenuItem
                            key={sibling.href}
                            onClick={() => handleSiblingClick(sibling.href)}
                            {...testId(`${PAGE_BREADCRUMB_TEST_IDS.dropdownItem}-${sibling.href.split('/').pop()}`)}
                          >
                            {sibling.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    // Last item without siblings - plain text
                    <span {...testId(PAGE_BREADCRUMB_TEST_IDS.currentItem)}>
                      {item.label}
                    </span>
                  )
                ) : (
                  // Not last item - link
                  <BreadcrumbLink
                    href={item.href}
                    {...testId(`${PAGE_BREADCRUMB_TEST_IDS.link}-${item.segment}`)}
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!item.isLast && (
                <BreadcrumbSeparator {...testId(PAGE_BREADCRUMB_TEST_IDS.separator)} />
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
