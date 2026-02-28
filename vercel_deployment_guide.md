# Vercel Deployment Guide

Deploying a Next.js application to Vercel is highly streamlined because Vercel built Next.js. Here are the steps:

## 1. Prepare Your Repository
Ensure all your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket). 
Vercel integrates specifically with these providers to enable automatic CI/CD (every time you push to `main`, it deploys).

## 2. Sign in to Vercel
1. Go to [Vercel Signup](https://vercel.com/signup).
2. Choose **"Continue with GitHub"** (or your preferred Git provider).
3. Authorize Vercel to access your GitHub account.

## 3. Import Project
1. Once on the Vercel Dashboard, click **Add New...** -> **Project**.
2. Find the SwipeMarket repository in the list and click **Import**.
3. Vercel will automatically detect that the framework is **Next.js**. You can leave the "Build and Output Settings" as default.

## 4. Add Environment Variables
Before clicking Deploy, expand the **Environment Variables** section.
Copy the variables from your local `.env.local` file and paste them here. 
At a minimum, you must include your Supabase configuration:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- (And any other secret keys required by your routers)

## 5. Deploy
1. Click **Deploy**.
2. Vercel will run `npm run build` on their servers.
3. Within 1-2 minutes, you will receive a live production URL (e.g., `https://swipemarket.vercel.app`).
4. **Crucial Next Step:** Go to your Supabase Dashboard -> **Authentication** -> **URL Configuration**, and add the new Vercel URL to your "Site URL" and "Redirect URLs". Without this, Supabase will not allow logins from the new domain!
