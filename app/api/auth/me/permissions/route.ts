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
import { cookies } from "next/headers";
import { getUserIdFromToken } from "@/lib/user";

/**
 * GET /api/auth/me/permissions
 * Récupère les permissions de l'utilisateur connecté
 * 
 * Cette route lit le cookie access_token côté serveur (httpOnly)
 * et retourne les permissions de l'utilisateur connecté
 */
export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Extraire le user_id du token
    const userId = getUserIdFromToken(accessToken);

    if (!userId) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 401 }
      );
    }

    // Appel à l'endpoint existant pour récupérer les permissions
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/identity/users/${userId}/permissions`,
      {
        headers: {
          Cookie: `access_token=${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Erreur lors de la récupération des permissions:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: "Erreur lors de la récupération des permissions" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur lors de la récupération des permissions:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
