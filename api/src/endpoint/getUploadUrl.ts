import { Handler } from "aws-lambda";
import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Photos go straight from the browser to S3 using a short-lived signed URL,
// so they never pass through Lambda or get stored in DynamoDB (400 KB item limit).
const ALLOWED_TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
};
const UPLOAD_URL_TTL_SECONDS = 300;

const s3 = new S3Client({});

const respond = (statusCode: number, body: unknown) => ({
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const getUploadUrl: Handler = async (event) => {
    const bucket = process.env.IMAGES_BUCKET_NAME;
    if (!bucket) {
        console.error("IMAGES_BUCKET_NAME is not set");
        return respond(500, { error: "Internal Server Error" });
    }

    let contentType = "";
    try {
        const raw = event?.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString("utf8") : event?.body;
        contentType = JSON.parse(raw ?? "{}").contentType ?? "";
    } catch {
        return respond(400, { error: "Request body must be JSON" });
    }
    const extension = ALLOWED_TYPES[contentType];
    if (!extension) return respond(400, { error: "Photos must be JPEG or PNG" });

    const imageKey = `images/${randomUUID()}.${extension}`;
    const uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: bucket, Key: imageKey, ContentType: contentType }),
        { expiresIn: UPLOAD_URL_TTL_SECONDS },
    );
    return respond(200, { uploadUrl, imageKey });
};
