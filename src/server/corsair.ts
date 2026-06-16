import "dotenv/config";
import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { conn } from "./db";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { env } from "~/env";

// @ts-expect-error - Zod version mismatch between plugins and core
export const corsair = createCorsair({
  plugins: [
    gmail({
      authType: "oauth_2",
      // @ts-expect-error - External types incorrectly require accessToken for multiTenancy
      credentials: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    }),
    googlecalendar({
      authType: "oauth_2",
      credentials: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    }),
  ],
  database: conn,
  kek: env.CORSAIR_KEK,
  multiTenancy: true,
  connect: {
    baseUrl: env.NEXT_PUBLIC_APP_URL,
    redirectUri: `${env.NEXT_PUBLIC_APP_URL}/api/corsair/callback`,
  },
});
