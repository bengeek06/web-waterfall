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

import Image from "next/image";
import InitApp from "@/components/pages/InitApp";
import { getDictionary } from "@/lib/utils/dictionaries";

function getLocaleFromHeaders(headers: Headers): "fr" | "en" {
  const acceptLang = headers.get("accept-language");
  if (!acceptLang) return "fr";
  if (acceptLang.toLowerCase().startsWith("en")) return "en";
  return "fr";
}

export default async function InitAppPage() {
  const { headers } = await import("next/headers");
  const headersObj = await headers();
  const locale = getLocaleFromHeaders(headersObj);
  const dictionary = await getDictionary(locale);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[var(--waterfall-bg-light)] to-white p-8">
      <div className="mb-8 text-center">
        <Image
          src="/waterfall_logo.svg"
          alt="Waterfall Logo"
          width={240}
          height={66}
          priority
          className="mb-4"
        />
        <p className="text-lg text-[var(--waterfall-primary-dark)] font-medium">
          {dictionary.description}
        </p>
      </div>
      <div className="w-full max-w-2xl mx-auto">
        <InitApp dictionary={dictionary.init_app} />
      </div>
    </div>
  );
}
