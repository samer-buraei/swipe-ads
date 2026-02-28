import { createTRPCRouter } from './trpc';
import { listingRouter } from './routers/listing';
import { swipeRouter } from './routers/swipe';
import { favoriteRouter } from './routers/favorite';
import { messageRouter } from './routers/message';
import { userRouter } from './routers/user';
import { categoryRouter } from './routers/category';
import { reportRouter } from './routers/report';
import { searchProfileRouter } from './routers/searchProfile';
import { adminRouter } from './routers/admin';

export const appRouter = createTRPCRouter({
  listing: listingRouter,
  swipe: swipeRouter,
  favorite: favoriteRouter,
  message: messageRouter,
  user: userRouter,
  category: categoryRouter,
  report: reportRouter,
  searchProfile: searchProfileRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
