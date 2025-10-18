import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

export async function GET(req: NextRequest, { params }: { params: Promise<{ user_id: string, user_role_id: string }> }) {
  logger.info("GET request to /api/identity/users/[user_id]/roles/[user_role_id]");

  const resolvedParams = await params;
  const user_id = resolvedParams.user_id;
  const user_role_id = resolvedParams.user_role_id;

  // Implement your logic to handle the GET request here

  return NextResponse.json({ user_id, user_role_id });
}