import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { eq } from "drizzle-orm";
import { corsairAccounts } from "~/server/db/corsair-schema";

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
});
