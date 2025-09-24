This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment configuration

Create a `.env.local` in the project root:

```
CIRCLE_API_TOKEN=YOUR_ADMIN_TOKEN
CIRCLE_COMMUNITY_ID=370251
# Optional overrides for Admin API
# CIRCLE_ADMIN_BASE_URL=https://app.circle.so
# CIRCLE_ADMIN_AUTH_SCHEME=bearer

# Headless member endpoint
CIRCLE_HEADLESS_TOKEN=YOUR_HEADLESS_MEMBER_TOKEN
# Optionally override base if different from admin
# CIRCLE_HEADLESS_BASE_URL=https://app.circle.so
```

#### Auth + MongoDB

Add the following to `.env.local` as well:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret

MONGODB_URI=mongodb+srv://circle:circle@2025@1move.lmlsxjh.mongodb.net/circle?retryWrites=true&w=majority&appName=1move

# Used once to create the admin if not present
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me
```

The dashboard table fetches live members from `/api/circle/members` and resolves:
- Country from member `country`
- Invited By from `invited_by.name`
- Referrer from the invitation link label (link name or creator)
### API Docs (OpenAPI)

OpenAPI JSON is available at:

```
/api/openapi.json
```

Use with Swagger UI or Redoc locally.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
