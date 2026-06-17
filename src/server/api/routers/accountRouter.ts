import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { eq } from "drizzle-orm";
import { corsairAccounts, corsairIntegrations } from "~/server/db/corsair-schema";

export const accountRouter = createTRPCRouter({
  hasConnectedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const accounts = await ctx.db
      .select()
      .from(corsairAccounts)
      .where(eq(corsairAccounts.tenantId, userId))
      .limit(1);

    return accounts.length > 0;
  }),

  getConnectedIntegrations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const integrations = await ctx.db
      .select({ name: corsairIntegrations.name })
      .from(corsairAccounts)
      .innerJoin(
        corsairIntegrations,
        eq(corsairAccounts.integrationId, corsairIntegrations.id)
      )
      .where(eq(corsairAccounts.tenantId, userId));

    return integrations.map((i) => i.name);
  }),
});
