import 'dotenv/config';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { conn } from './db';
import { googlecalendar } from '@corsair-dev/googlecalendar';



export const corsair = createCorsair({
    plugins: [
        gmail({
            authType: "oauth_2",
            // @ts-expect-error - External types incorrectly require accessToken for multiTenancy
            credentials: {
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            },
        }),
        googlecalendar({
            authType: "oauth_2",
            credentials: {
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            }
        })
    ],
    database: conn,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
    connect: {
        baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        redirectUri: "http://localhost:3000/api/corsair/callback"
    }
});