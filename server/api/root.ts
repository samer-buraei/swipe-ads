import { createTRPCRouter } from './trpc';
import { listingRouter } from './routers/listing';
import { swipeRouter } from './routers/swipe';
import { favoriteRouter } from './routers/favorite';
import { messageRouter } from './routers/message';
import { userRouter } from './routers/user';
import { categoryRouter } from './routers/category';

export const appRouter = createTRPCRouter({
  listing: listingRouter,
  swipe: swipeRouter,
  favorite: favoriteRouter,
  message: messageRouter,
  user: userRouter,
  category: categoryRouter,
});

export type AppRouter = typeof appRouter;
