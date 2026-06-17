import { postRouter } from "~/server/api/routers/post";
import { accountRouter } from "~/server/api/routers/accountRouter";
import { emailRouter } from "~/server/api/routers/email";
import { calendarRouter } from "~/server/api/routers/calendar";
import { aiRouter } from "~/server/api/routers/ai";
import { billingRouter } from "~/server/api/routers/billing";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  account: accountRouter,
  email: emailRouter,
  calendar: calendarRouter,
  ai: aiRouter,
  billing: billingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
