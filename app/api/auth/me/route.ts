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

import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromToken, getCompanyIdFromToken } from "@/lib/server/user";

/**
 * GET /api/auth/me
 * Returns the current user's ID and company ID from the JWT token
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  
  if (!token) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const userId = getUserIdFromToken(token);
  const companyId = getCompanyIdFromToken(token);

  if (!userId) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user_id: userId,
    company_id: companyId,
  });
}
