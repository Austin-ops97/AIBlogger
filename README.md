# AIBlogger 🤖

A full-stack AI-powered blog platform built with Next.js, where you can write posts manually OR paste any URL and let Claude AI automatically generate a detailed blog review.

## Features

- **Clean home page** — Modern blog listing with post cards
- **Admin panel** — Protected dashboard to manage all posts
- **Manual post creation** — Rich Markdown editor with live preview
- **AI URL Review** — Paste any URL → Claude fetches the page and writes a full blog post review
- **Post editing & deletion** — Full CRUD from the admin panel
- **JWT authentication** — Secure login with httpOnly cookies
- **SQLite database** — Portable, no external database needed

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | SQLite via better-sqlite3 |
| Auth | JWT + bcryptjs |
| AI | Anthropic Claude API (claude-sonnet-4-6) |
| Language | TypeScript |

## Getting Started

### 1. Install dependencies

```bash
cd AIBlogger
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-...   # Get from https://console.anthropic.com/
JWT_SECRET=your-random-secret-here
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Login Credentials

```
Username: austin
Password: admin123
```

> ⚠️ Change these for production use. See the `.env.local` file for instructions on setting custom credentials.

## Usage

### Writing a manual post
1. Log in at `/login`
2. Go to Admin → **New Post**
3. Write using Markdown (preview button included)
4. Click **Publish Post**

### Generating an AI review
1. Log in at `/login`
2. Go to Admin → **AI Review**
3. Paste any product/service URL
4. Claude fetches the page and generates a full review
5. Edit the title, excerpt, and content as needed
6. Click **Publish Post**

## Project Structure

```
AIBlogger/
├── app/
│   ├── page.tsx              # Home page (post listing)
│   ├── login/page.tsx        # Login page
│   ├── posts/[slug]/page.tsx # Individual post view
│   ├── admin/
│   │   ├── page.tsx          # Admin dashboard
│   │   ├── new/page.tsx      # New post editor
│   │   ├── edit/[id]/page.tsx# Edit post
│   │   └── ai-review/page.tsx# AI URL review
│   └── api/
│       ├── auth/             # Login/logout/check
│       ├── posts/            # CRUD API
│       └── ai/generate/      # AI generation endpoint
├── components/
│   ├── Navbar.tsx
│   ├── PostCard.tsx
│   └── AdminPostRow.tsx
├── lib/
│   ├── db.ts                 # SQLite helpers
│   └── auth.ts               # JWT helpers
├── middleware.ts              # Auth protection
└── data/                     # SQLite database (auto-created)
```

## Deployment

For production deployment on Vercel or similar:
1. Set `ANTHROPIC_API_KEY` and `JWT_SECRET` in environment variables
2. Note: SQLite works great for personal use, but consider a hosted DB (Supabase, PlanetScale) for multi-instance deployments
3. Run `npm run build` to verify the build succeeds

## License

MIT
