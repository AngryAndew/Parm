import { Handler } from "aws-lambda";
import { randomUUID } from "crypto";
import { DynamoDbProxy } from '../proxy/DynamoDbProxy'
import { Ingredient, Recipe } from "../model/Recipe";

const respond = (statusCode: number, body: unknown) => ({
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? "parm";

function parseBody(event: any): any {
    const raw = event?.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString("utf8") : event?.body;
    return JSON.parse(raw ?? "{}");
}

// Returns an error message, or undefined if the recipe looks valid.
function validate(body: any): string | undefined {
    if (typeof body.title !== "string" || !body.title.trim()) return "title is required";
    if (!Array.isArray(body.ingredients)) return "ingredients must be a list";
    if (!Array.isArray(body.directions)) return "directions must be a list";
    if (body.ingredients.some((i: any) => typeof i?.name !== "string")) return "each ingredient needs a name";
    if (body.directions.some((d: any) => typeof d !== "string")) return "each direction must be text";
    return undefined;
}

export const putRecipe: Handler = async (event) => {
    let body: any;
    try {
        body = parseBody(event);
    } catch {
        return respond(400, { error: "Request body must be JSON" });
    }
    const problem = validate(body);
    if (problem) return respond(400, { error: problem });

    const now = new Date().toISOString();
    const recipe: Recipe = {
        userId: DEFAULT_USER_ID, // one shared household partition; set by the server, not the browser
        recipeId: body.recipeId || randomUUID(), // pass an existing recipeId to update a recipe
        title: body.title.trim(),
        date: body.date || now.slice(0, 10),
        ingredients: body.ingredients
            .map((i: Ingredient) => ({ name: i.name.trim(), amount: (i.amount ?? "").trim() }))
            .filter((i: Ingredient) => i.name),
        directions: body.directions.map((d: string) => d.trim()).filter(Boolean),
        sourceUrl: body.sourceUrl || undefined,
        imageKey: body.imageKey || undefined,
        createdAt: body.createdAt || now,
        updatedAt: now,
    };

    try {
        await new DynamoDbProxy().putRecipe(recipe);
        return respond(200, { recipeId: recipe.recipeId, recipe });
    } catch (error: any) {
        console.error("Failed to save recipe", error);
        return respond(500, { error: "Internal Server Error" });
    }
}
