import { createTRPCRouter } from './trpc';
import { authRouter } from './routers/auth';
import { listingRouter } from './routers/listing';
import { swipeRouter } from './routers/swipe';
import { favoriteRouter } from './routers/favorite';
import { messageRouter } from './routers/message';
import { userRouter } from './routers/user';
import { categoryRouter } from './routers/category';
import { reportRouter } from './routers/report';
import { searchProfileRouter } from './routers/searchProfile';
import { adminRouter } from './routers/admin';
import { ratingRouter } from './routers/rating';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  listing: listingRouter,
  swipe: swipeRouter,
  favorite: favoriteRouter,
  message: messageRouter,
  user: userRouter,
  category: categoryRouter,
  report: reportRouter,
  searchProfile: searchProfileRouter,
  admin: adminRouter,
  rating: ratingRouter,
});

export type AppRouter = typeof appRouter;
