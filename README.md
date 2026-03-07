# Sound For Ears – Clinic Management Web App

Next.js app for clinic management (admin, staff, patient roles). Uses MySQL and Prisma.

## MySQL setup

1. **Create a database** on your MySQL server (e.g. in cPanel: MySQL® Databases → Create Database). Example name: `soundforears`.
2. **Assign the user** to that database with “All privileges” (e.g. “Add User To Database”).
3. **Configure `.env`** with your URL (password with `* ) =` must be URL-encoded: `*` → `%2A`, `)` → `%29`, `=` → `%3D`):
   ```bash
   DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
   AUTH_SECRET="a-long-random-secret"
   ```
4. **Apply schema and seed**:
   ```bash
   npm run db:push
   npm run db:seed
   ```
   Seed logins: `admin@soundforears.test` / `Admin123!`, `staff@soundforears.test` / `Staff123!`, `patient@soundforears.test` / `Patient123!`.

## Getting Started

Run the development server:

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
