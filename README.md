# DAO Challenge

A team challenge game for Davidson Academy Online students. Students join one of four teams, complete real-world challenges, submit photo evidence, and earn points for their team on a shared leaderboard.

**Live site:** https://dao-challenge.azurewebsites.net/

## Features
- **Teams:** new students are automatically placed on one of four teams when they register.
- **Challenge ladders:** each category (photography, cooking, artwork, and more) has challenges from easy to hard. Only the first level starts unlocked; completing one unlocks the next.
- **Submissions:** teams submit up to 10 images, an optional video link, and a note as evidence.
- **Admin review:** admins approve or reject submissions with feedback. The first approved team wins the challenge and earns points based on difficulty; other pending submissions are closed automatically.
- **Notifications:** in-app notifications, plus optional email through SMTP.
- **Admin tools:** manage categories, challenges, teams, and users, and end the event.

## Tech stack
Next.js (App Router) · React · TypeScript · Tailwind CSS · Prisma with SQLite · JWT sessions (jose) and bcrypt · Zod · Nodemailer · Azure App Service

## Run locally
```bash
npm install
cp .env.example .env   # then set AUTH_SECRET, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD
npm run setup          # generates the Prisma client, creates the database, and seeds it
npm run dev
```
Then open http://localhost:3000 and log in with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

## Deploying to Azure App Service
- Startup command: `npm run start:azure`. It creates the upload folder, applies the database schema, runs the seed script, and starts the app.
- Set `DATABASE_URL`, `AUTH_SECRET`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `UPLOAD_DIR` in the app settings. Keep the database and uploads on persistent storage such as `/home/data`.
- The seed script runs on every start. When both admin settings are set, it also resets that admin's password to `SEED_ADMIN_PASSWORD`.
