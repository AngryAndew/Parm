import { Handler } from "aws-lambda";
import { parseRecipeFromHtml } from "../parser/recipeParser";

// Pretend to be a normal browser; many recipe sites block unknown user agents.
const BROWSER_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
};
const PAGE_TIMEOUT_MS = 10_000;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // keep the response under Lambda's 6 MB limit

const respond = (statusCode: number, body: unknown) => ({
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

function readUrl(event: any): string | undefined {
    if (event?.queryStringParameters?.url) return event.queryStringParameters.url;
    if (!event?.body) return undefined;
    try {
        const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
        return JSON.parse(raw)?.url;
    } catch {
        return undefined;
    }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { headers: BROWSER_HEADERS, redirect: "follow", signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

// Download the photo (JPEG/PNG only — jsPDF can't embed WebP) and hand it back as a data URL, so the React app can show it
// and jsPDF can embed it without running into cross-origin issues.
async function fetchImageAsDataUrl(imageUrl: string, pageUrl: string): Promise<string | undefined> {
    try {
        const absolute = new URL(imageUrl, pageUrl).toString();
        const res = await fetchWithTimeout(absolute, 5_000);
        const type = res.headers.get("content-type") ?? "";
        if (!res.ok || !/^image\/(jpeg|jpg|png|webp)/i.test(type)) return undefined;
        const bytes = Buffer.from(await res.arrayBuffer());
        if (bytes.length > MAX_IMAGE_BYTES) return undefined;
        return `data:${type.split(";")[0]};base64,${bytes.toString("base64")}`;
    } catch {
        return undefined;
    }
}

export const importRecipe: Handler = async (event) => {
    const url = readUrl(event);
    let parsed: URL;
    try {
        parsed = new URL(url ?? "");
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
        return respond(400, { error: "Send a JSON body like {\"url\": \"https://...\"} with a valid recipe link." });
    }

    let html: string;
    try {
        const res = await fetchWithTimeout(parsed.toString(), PAGE_TIMEOUT_MS);
        if (!res.ok) {
            return respond(502, { error: `The recipe site answered with HTTP ${res.status}. It may block automated requests.` });
        }
        html = await res.text();
    } catch (error: any) {
        console.error("Fetch failed", parsed.toString(), error);
        return respond(502, { error: "Couldn't load that page (timed out or unreachable)." });
    }

    const recipe = parseRecipeFromHtml(html);
    if (!recipe || (!recipe.ingredients.length && !recipe.directions.length)) {
        return respond(422, {
            error: "No recipe data found on that page. The site may not publish structured recipe info — you'll need to type this one in.",
        });
    }

    const image = recipe.imageUrl ? await fetchImageAsDataUrl(recipe.imageUrl, parsed.toString()) : undefined;

    return respond(200, {
        sourceUrl: parsed.toString(),
        title: recipe.title,
        ingredients: recipe.ingredients,
        directions: recipe.directions,
        imageUrl: recipe.imageUrl,
        image, // base64 data URL, or undefined if the photo couldn't be fetched
    });
};
