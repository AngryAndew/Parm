import { Handler } from "aws-lambda";
import { CognitoJwtVerifier } from "aws-jwt-verify";

// Every API Lambda is wrapped with this. The browser sends the Cognito access token
// from the login as "Authorization: Bearer <token>"; anything else gets a 401.
// Users can only be created by an admin (self sign-up is off), so a valid token
// means it's one of the household's accounts.

let verifier: ReturnType<typeof CognitoJwtVerifier.create<{ userPoolId: string; tokenUse: "access"; clientId: string }>> | undefined;

function getVerifier() {
    if (!verifier) {
        const userPoolId = process.env.COGNITO_USER_POOL_ID;
        const clientId = process.env.COGNITO_CLIENT_ID;
        if (!userPoolId || !clientId) throw new Error("COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID are not set");
        verifier = CognitoJwtVerifier.create({ userPoolId, tokenUse: "access", clientId });
    }
    return verifier;
}

const unauthorized = () => ({
    statusCode: 401,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error: "Please sign in again." }),
});

export function requireAuth(handler: Handler): Handler {
    return async (event, context, callback) => {
        const headers = event?.headers ?? {};
        const header: string = headers.authorization ?? headers.Authorization ?? "";
        const token = header.replace(/^Bearer\s+/i, "");
        if (!token) return unauthorized();
        try {
            const claims = await getVerifier().verify(token);
            event.requestContext = { ...(event.requestContext ?? {}), parmUser: claims.username ?? claims.sub };
        } catch (error) {
            console.warn("Rejected token", (error as Error).message);
            return unauthorized();
        }
        return handler(event, context, callback);
    };
}
