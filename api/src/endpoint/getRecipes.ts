import { Handler } from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DynamoDbProxy } from "../proxy/DynamoDbProxy";

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? "parm";
const IMAGE_URL_TTL_SECONDS = 60 * 60;

const s3 = new S3Client({});

const respond = (statusCode: number, body: unknown) => ({
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

// Returns every saved recipe, newest first. Each one with a photo gets a
// temporary imageUrl the browser can load from the private images bucket.
export const getRecipes: Handler = async (event) => {
    const userId = event?.queryStringParameters?.userId || DEFAULT_USER_ID;
    const bucket = process.env.IMAGES_BUCKET_NAME;
    try {
        const recipes = await new DynamoDbProxy().listRecipes(userId);
        recipes.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        const withImages = await Promise.all(recipes.map(async (recipe) => {
            if (!recipe.imageKey || !bucket) return recipe;
            const imageUrl = await getSignedUrl(
                s3,
                new GetObjectCommand({ Bucket: bucket, Key: recipe.imageKey }),
                { expiresIn: IMAGE_URL_TTL_SECONDS },
            );
            return { ...recipe, imageUrl };
        }));
        return respond(200, { recipes: withImages });
    } catch (error: any) {
        console.error("Failed to list recipes", error);
        return respond(500, { error: "Internal Server Error" });
    }
};
