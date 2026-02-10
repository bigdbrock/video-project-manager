# Vercel Deployment

## Steps
1. Push `video-project-manager-app` to GitHub.
2. In Vercel, click **New Project** and import the repo.
3. Set Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Set Install Command to `pnpm install --no-frozen-lockfile`
5. Set Build Command to `pnpm build`
6. Deploy.

## Notes
- This repo uses pnpm for faster installs on Vercel.
- After deployment, log in using Supabase Auth credentials.
