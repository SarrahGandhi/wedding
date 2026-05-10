# Wedding

Simple wedding manager

## Invite

A guest that belongs to a family is able to set rsvp status for each member of the family for any events (even if the guest themselves are not invited to that event but a family member is)

## Database

[Documentation](supabase/README.md)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) (required for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (installed as a dev dependency)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start local Supabase

```bash
pnpm supabase start
```

This spins up a local Supabase instance via Docker. Once running, it will print out your local API URL, anon key, and other credentials.

### 3. Set up environment variables

Copy the output from `supabase start` and create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54322
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-local-anon-key>
```

### 4. Apply migrations and seed data

```bash
pnpm supabase db reset
```

This applies all migrations in `supabase/migrations/` and runs `supabase/seed.sql`.

### 5. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Useful commands

| Command                  | Description                         |
| ------------------------ | ----------------------------------- |
| `pnpm supabase start`    | Start local Supabase                |
| `pnpm supabase stop`     | Stop local Supabase                 |
| `pnpm supabase db reset` | Reset DB, reapply migrations + seed |
| `pnpm supabase status`   | Show local Supabase URLs and keys   |

## Linking to Remote Supabase

### 1. Log in to Supabase

```bash
pnpm supabase login
```

### 2. Link your local project to a remote project

```bash
pnpm supabase link --project-ref <your-project-ref>
```

You can find your project ref in the Supabase dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`.

### 3. Push local migrations to remote

```bash
pnpm supabase db push
```

This applies any local migrations that haven't been run on the remote database yet.

### 4. Pull remote changes (if schema was changed via the dashboard)

```bash
pnpm supabase db pull
```

This generates a new migration file from any remote schema changes not yet captured locally.

### 5. Update environment for production

Set your production environment variables to point at the remote Supabase project:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-remote-anon-key>
```