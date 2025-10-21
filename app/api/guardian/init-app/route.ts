/**
 * API route handler for `/api/guardian/init-app`.
 *
 * Ce module proxy les requêtes GET et POST vers le service Guardian (endpoint `/init-db`).
 *
 * ## Méthodes HTTP supportées :
 * - **GET** : Vérifie le statut d'initialisation du service Guardian.
 * - **POST** : Initialise la base Guardian (création des données initiales).
 *
 * ## Détails d'implémentation :
 * - Toutes les requêtes sont transmises au backend Guardian via la variable d'environnement `GUARDIAN_SERVICE_URL`.
 * - Tous les headers sauf `host` sont forwardés.
 * - Gère les réponses JSON et texte.
 * - Forward le header `set-cookie` si présent.
 * - Utilise le mode dynamique (`force-dynamic`).
 *
 * @module api/guardian/init-app/route
 */
import { NextResponse, NextRequest } from "next/server";
import logger from "@/lib/logger";

const GUARDIAN_SERVICE_URL = process.env.GUARDIAN_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Gère les requêtes GET sur `/api/guardian/init-app`.
 *
 * - En dev/test, retourne `{ initialized: true }`.
 * - Sinon, proxy la requête vers GUARDIAN_SERVICE_URL/init-db.
 *
 * @param req - Objet requête Next.js
 * @returns Un NextResponse avec la réponse du service Guardian
 */
export async function GET(req: Request) {
    logger.info("GET request to /api/guardian/init-app");

    if (process.env.MOCK_API === 'true') {
        logger.warn("Running in development/test mode");
        return NextResponse.json({ initialized: false });
    }

    if (!GUARDIAN_SERVICE_URL) {
        logger.error("GUARDIAN_SERVICE_URL is not defined");
        return NextResponse.json({ error: "GUARDIAN_SERVICE_URL is not defined" }, { status: 500 });
    }
    logger.debug(`Guardian service URL: ${GUARDIAN_SERVICE_URL}`);
    logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers.entries()))}`);
    logger.debug(`Forwarding ${req.url} to ${GUARDIAN_SERVICE_URL}/init-db`);

    const response = await fetch(`${GUARDIAN_SERVICE_URL}/init-db`, {
        method: "GET",
        headers: Object.fromEntries(
            Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
        ),
        credentials: "include",
    });

    const contentType = response.headers.get("content-type");
    let nextRes;
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        logger.debug(`Response data: ${JSON.stringify(data)}`);
        nextRes = NextResponse.json(data, { status: response.status });
    } else {
        const text = await response.text();
        logger.debug(`Response text: ${text}`);
        nextRes = new NextResponse(text, { status: response.status });
    }
    return nextRes;
}

/**
 * Gère les requêtes POST sur `/api/guardian/init-app`.
 *
 * - En dev/test, retourne `{ message: "Guardian initialized successfully" }`.
 * - Sinon, proxy la requête vers GUARDIAN_SERVICE_URL/init-db.
 *
 * @param req - Objet requête Next.js
 * @returns Un NextResponse avec la réponse du service Guardian
 */
export async function POST(req: NextRequest) {
    logger.info("POST request to /api/guardian/init-app");

    if (process.env.MOCK_API === 'true') {
        logger.warn("Running in development/test mode: returning mock guardian initialized");
        return NextResponse.json({ message: "Guardian initialized successfully" });
    }

    if (!GUARDIAN_SERVICE_URL) {
        logger.error("GUARDIAN_SERVICE_URL is not defined");
        return NextResponse.json({ error: "GUARDIAN_SERVICE_URL is not defined" }, { status: 500 });
    }
    logger.debug(`Environment GUARDIAN_SERVICE_URL:${GUARDIAN_SERVICE_URL}`);
    logger.debug(`Forwarding ${req.url} to ${GUARDIAN_SERVICE_URL}/init-db`);

    let body;
    try {
        body = await req.json();
        logger.debug(`POST body: ${JSON.stringify(body)}`);
    } catch (err) {
        logger.error(`Erreur lors du parsing du body JSON: ${err}`);
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Construit les headers de manière propre
    const forwardedHeaders = new Headers();
    
    // Forward tous les headers sauf ceux qui causent des conflits
    req.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey !== "host" && lowerKey !== "content-length" && lowerKey !== "content-type") {
            forwardedHeaders.set(key, value);
        }
    });
    
    // Force les headers nécessaires pour le POST JSON
    forwardedHeaders.set("Content-Type", "application/json");

    const res = await fetch(`${GUARDIAN_SERVICE_URL}/init-db`, {
        method: "POST",
        headers: forwardedHeaders,
        body: JSON.stringify(body),
        credentials: "include",
    });

    const setCookie = res.headers.get("set-cookie");
    const contentType = res.headers.get("content-type");
    let nextRes;
    if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        logger.debug(`Response data: ${JSON.stringify(data)}`);
        nextRes = NextResponse.json(data, { status: res.status });
    } else {
        const text = await res.text();
        logger.debug(`Response text: ${text}`);
        nextRes = new NextResponse(text, { status: res.status });
    }
    if (setCookie) nextRes.headers.set("set-cookie", setCookie);
    return nextRes;
}
