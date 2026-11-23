// Pulls a recipe out of a web page's HTML.
//
// Almost every recipe site (AllRecipes, NYT Cooking, Food Network, most food blogs
// using WP Recipe Maker / Tasty Recipes, etc.) embeds the recipe as schema.org
// "Recipe" JSON-LD for Google. We read that instead of scraping each site's markup.

export type ImportedIngredient = { name: string; amount: string };

export type ImportedRecipe = {
    title: string;
    ingredients: ImportedIngredient[];
    directions: string[];
    imageUrl?: string;
};

const ENTITIES: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    frac12: "½", frac14: "¼", frac34: "¾", deg: "°", ndash: "–", mdash: "—",
    rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…",
};

export function cleanText(value: unknown): string {
    if (typeof value !== "string") return "";
    return value
        .replace(/<[^>]*>/g, " ") // strip any HTML tags
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
        .replace(/&([a-z]+\d*);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
        .replace(/\s+/g, " ")
        .trim();
}

function isRecipeNode(node: any): boolean {
    const type = node?.["@type"];
    if (Array.isArray(type)) return type.includes("Recipe");
    return type === "Recipe";
}

// JSON-LD can be a single object, an array, or wrapped in "@graph" (Yoast etc.).
function findRecipeNode(data: any): any | undefined {
    if (!data || typeof data !== "object") return undefined;
    if (Array.isArray(data)) {
        for (const item of data) {
            const found = findRecipeNode(item);
            if (found) return found;
        }
        return undefined;
    }
    if (isRecipeNode(data)) return data;
    if (data["@graph"]) return findRecipeNode(data["@graph"]);
    if (data.mainEntity) return findRecipeNode(data.mainEntity);
    return undefined;
}

function extractJsonLdBlocks(html: string): any[] {
    const blocks: any[] = [];
    const re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    while ((match = re.exec(html)) !== null) {
        const raw = match[1].trim().replace(/^<!\[CDATA\[|\]\]>$/g, "");
        try {
            blocks.push(JSON.parse(raw));
        } catch {
            // Some sites put raw newlines inside strings; try once more with them flattened.
            try {
                blocks.push(JSON.parse(raw.replace(/[\r\n\t]+/g, " ")));
            } catch {
                /* skip unparseable block */
            }
        }
    }
    return blocks;
}

// recipeInstructions can be a string, a list of strings, HowToStep objects,
// or HowToSection objects that contain their own steps.
function flattenInstructions(value: any): string[] {
    if (!value) return [];
    if (typeof value === "string") {
        // A single blob: split on line breaks, or on numbered steps.
        const parts = value.split(/\r?\n|<br\s*\/?>|<\/p>|<\/li>/i).map(cleanText).filter(Boolean);
        return parts.length ? parts : [cleanText(value)];
    }
    if (Array.isArray(value)) return value.flatMap(flattenInstructions);
    if (typeof value === "object") {
        if (value.itemListElement) {
            const steps = flattenInstructions(value.itemListElement);
            // Keep the section name ("For the sauce:") as its own line so it isn't lost.
            const sectionName = value["@type"] === "HowToSection" ? cleanText(value.name) : "";
            return sectionName ? [`${sectionName}:`, ...steps] : steps;
        }
        return [cleanText(value.text ?? value.name ?? value.description)].filter(Boolean);
    }
    return [];
}

function pickImage(value: any): string | undefined {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return pickImage(value[0]);
    if (typeof value === "object") return value.url ?? value.contentUrl;
    return undefined;
}

const UNITS = [
    "cups?", "c\\.", "tablespoons?", "tbsps?\\.?", "tbs\\.?", "T\\.?", "teaspoons?", "tsps?\\.?", "t\\.?",
    "ounces?", "oz\\.?", "fluid ounces?", "fl\\.? oz\\.?", "pounds?", "lbs?\\.?", "grams?", "g", "kilograms?", "kg",
    "milliliters?", "millilitres?", "ml", "liters?", "litres?", "l", "quarts?", "qts?\\.?", "pints?", "pts?\\.?",
    "gallons?", "gal\\.?", "cloves?", "cans?", "jars?", "packages?", "pkgs?\\.?", "sticks?", "slices?",
    "pinch(?:es)?", "dash(?:es)?", "handfuls?", "bunch(?:es)?", "heads?", "sprigs?", "stalks?", "pieces?",
    "large", "medium", "small", "whole",
];
const QTY = "[\\d¼½¾⅓⅔⅛⅜⅝⅞⅕⅙/.,]+(?:\\s*(?:-|–|to)\\s*[\\d¼½¾⅓⅔⅛⅜⅝⅞⅕⅙/.,]+)?";
const AMOUNT_RE = new RegExp(
    `^((?:${QTY}\\s*)+(?:\\([^)]*\\)\\s*)?(?:(?:${UNITS.join("|")})(?=\\s|$)\\s*)?)(.*)$`,
    "i",
);

// "2 1/2 cups all-purpose flour" -> { amount: "2 1/2 cups", name: "all-purpose flour" }
// "Salt to taste"                -> { amount: "",           name: "Salt to taste" }
export function splitIngredient(line: string): ImportedIngredient {
    const text = cleanText(line);
    const match = AMOUNT_RE.exec(text);
    if (match && match[2].trim()) {
        return { amount: match[1].trim(), name: match[2].trim().replace(/^of\s+/i, "") };
    }
    return { amount: "", name: text };
}

export function parseRecipeFromHtml(html: string): ImportedRecipe | undefined {
    for (const block of extractJsonLdBlocks(html)) {
        const node = findRecipeNode(block);
        if (!node) continue;
        const ingredientLines: any[] = node.recipeIngredient ?? node.ingredients ?? [];
        return {
            title: cleanText(node.name ?? node.headline),
            ingredients: (Array.isArray(ingredientLines) ? ingredientLines : [ingredientLines])
                .map((line) => splitIngredient(String(line)))
                .filter((i) => i.name),
            directions: flattenInstructions(node.recipeInstructions),
            imageUrl: pickImage(node.image),
        };
    }
    return undefined;
}
