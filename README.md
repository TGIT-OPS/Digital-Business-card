# TGIT Nexus

Digital business cards for [TGIT Pte Ltd](https://tgitsolutions.com). One super admin signs in and manages every company and card. There is no public sign-up.

Each company keeps its own logo, colours, layout and cards, so other client companies can be added later. Customer logins and billing are not part of this app.

The public card for the first person is [https://cards.tgitsolutions.com/c/manoharan](https://cards.tgitsolutions.com/c/manoharan).

## What you need

- A [Supabase](https://supabase.com) project on the free plan (database, login, and file storage).
- A [Cloudflare Pages](https://pages.cloudflare.com) project on the free plan, connected to this GitHub repository.
- Node.js 22 if you want to run the one-time seed from your computer. Cloudflare runs the build for you after that.

Do not use Vercel. Its free plan does not allow commercial use.

## 1. Create the Supabase project

1. Sign in at [supabase.com](https://supabase.com) and create a project. The free plan is enough.
2. Wait until the database is ready.
3. Open **Authentication → Providers → Email**.
4. Turn **off** “Allow new users to sign up”. People must not be able to register themselves.
5. You can leave “Confirm email” on or off. The seed marks the super admin as already confirmed.

## 2. Create the database

1. Open **SQL Editor → New query**.
2. Paste the whole file `supabase/migrations/20261118120000_init.sql`.
3. Click **Run**. You should see “Success”.
4. Run it again if you are unsure. It is safe to repeat.

This creates companies, cards, products and view counts. Visitors can only read cards that are enabled, and only when that company is active. Only the super admin can change anything. The anon key cannot edit cards.

Logos, photos and short videos go in a public Storage bucket named `media`. The migration creates that bucket.

## 3. Add the keys to a file on your computer

1. Install Node.js 22 from [nodejs.org](https://nodejs.org) if you do not have it.
2. Download this repository (or clone it) and open a terminal in that folder.
3. Copy the example environment file:

```bash
cp .env.example .env
```

4. In Supabase open **Project Settings → API**.
5. Put these values in `.env`:

| Name in `.env` | Where to copy it from |
| --- | --- |
| `PUBLIC_SUPABASE_URL` | Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key. This is a secret. |
| `SUPER_ADMIN_EMAIL` | The email address you will sign in with |
| `SUPER_ADMIN_PASSWORD` | A long password you choose |
| `PUBLIC_BASE_URL` | `https://cards.tgitsolutions.com` |

Never commit `.env`. The repository is public. The service role key must only live in `.env` and in Cloudflare’s secret settings.

## 4. Load TGIT and create the login

```bash
npm install
npm run seed
```

That creates:

- The super admin login (email and password from `.env`).
- Company **TGIT Pte Ltd**, 101 Eunos Ave 3, Singapore 409835, +65 80151060, https://tgitsolutions.com.
- Six real services, and the tagline “Clear ownership. Connected teams.”
- The card for **Manoharan Pethappan**, IT Manager, slug `manoharan`, email manoharan@tgitsolutions.com, phone +65 8015 1060.
- The TGIT logo and the looping header video in Storage.

You can delete `SUPER_ADMIN_PASSWORD` from `.env` after this. The running site does not need the password. To change the password later, use Supabase → Authentication → Users.

If you would rather create the user by hand: Authentication → Users → Add user → turn on Auto Confirm. Use the same email as `SUPER_ADMIN_EMAIL`, then run `npm run seed` again so the profile is marked super admin.

## 5. Try it on your computer

```bash
npm run dev
```

Open http://localhost:5173 and sign in. You should see the dashboard, the company, and Manoharan’s card. The public page is http://localhost:5173/c/manoharan.

QR codes and copied links use `PUBLIC_BASE_URL`. For a local trial, set that to `http://localhost:5173` and restart. Put `https://cards.tgitsolutions.com` back before you deploy.

## 6. Publish on Cloudflare Pages

1. Push this repository to GitHub if it is not there already.
2. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git**.
3. Choose this repository.
4. Build settings:
   - Framework preset: **SvelteKit** (or None)
   - Build command: `npm run build`
   - Build output directory: `.svelte-kit/cloudflare`
5. Add the same environment variables as in `.env`, **except** do not add `SUPER_ADMIN_PASSWORD`:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (mark it as a secret / encrypted)
   - `SUPER_ADMIN_EMAIL`
   - `PUBLIC_BASE_URL` = `https://cards.tgitsolutions.com`
6. Deploy. The first build takes a few minutes.
7. Open the `*.pages.dev` address Cloudflare gives you and sign in, to confirm it works before you attach the domain.

`wrangler.jsonc` already asks Cloudflare for the Node.js compatibility flag. You do not need to set that by hand.

## 7. Point cards.tgitsolutions.com at Cloudflare

`cards` is a subdomain of the domain you already own.

1. In the Cloudflare Pages project, open **Custom domains → Set up a custom domain**.
2. Enter `cards.tgitsolutions.com`.
3. Cloudflare shows a CNAME target such as `tgit-nexus.pages.dev`.
4. At the DNS host for `tgitsolutions.com` (Cloudflare DNS, or whoever hosts the domain today), add:

| Type | Name | Target |
| --- | --- | --- |
| CNAME | `cards` | the `*.pages.dev` hostname Cloudflare showed you |

5. Wait until the custom domain in Pages says Active. HTTPS is turned on for you.

If `tgitsolutions.com` already uses Cloudflare DNS, Pages can add this record itself when you attach the domain.

Leave the website at `tgitsolutions.com` where it is. Only the `cards` name moves.

## Using the admin

Sign in at `/login`. The sidebar has Dashboard, Cards and Companies.

- **Dashboard** shows how many cards and companies you have, how many times cards were opened, and how many people saved the contact.
- **Companies** stores the address, phone, email, website, about text, mission, logo, colours, one of three layouts (Classic Vertical, Red Bold, Minimal), products, social links, and optional video.
- **Cards** is the list. Search by name and filter by company or by Ready / Draft. Open a card to edit the person, watch the phone preview, copy the link, download the QR (PNG and SVG) and download the print PDF.

A card that is not enabled, or that belongs to an inactive company, is hidden from the public link.

### Colours

Company colours drive the public card and the print PDF. On a single card you can turn off “Use company colours” and set a different palette. The phone preview updates as you change them. The print PDF ignores the per-card colours and keeps the company palette, so a printed batch for one company stays consistent.

Red is used for large headings on white and for buttons. Gold and pale yellow are for shapes and soft fills, not for small text.

### Video

On a company, open **Media**:

- **Intro / product video:** upload an MP4 up to **8 MB**, or paste a YouTube or Vimeo link. Other websites are rejected. Add a poster image if you want a picture before play. “Muted autoplay” starts the video only after it scrolls into view, with the sound off.
- **Header video:** a looping MP4 up to **8 MB** (or a GIF up to **3 MB**), clipped into the red wave on the Classic card. Add a poster image. The printed card uses that poster with a red tint. Visitors who prefer reduced motion see the poster instead of the video. A card can upload its own header video; otherwise it uses the company’s.

A card can have its own intro video. If it does not, the company’s video is shown. Video is never placed on the print PDF.

Supabase’s free plan includes 1 GB of file storage. Keep clips short (about 20–30 seconds). Logos should be PNG or JPEG under 2 MB.

### Print PDF

**Print card PDF** downloads a two-page file, 55 mm wide and 90 mm tall. The front is the person and the logo. The back is the QR code and the company contact details. It is built in the browser, so it stays inside Cloudflare’s free plan.

### QR code

Each card’s QR code opens `https://cards.tgitsolutions.com/c/<slug>` (or whatever `PUBLIC_BASE_URL` is). Download it as PNG or SVG from the card editor. The public page shows the same code under “Scan for our products & services”.

### Save contact

**Save Contact** downloads a `.vcf` file. Phones import the name, title, company, phone, email, website and Singapore address.

### Counts

Opening a public card counts a view. Downloading the contact counts a save. Call, WhatsApp, Email, Website, Directions, Share and Video count as clicks. The numbers are on the dashboard and on each card. Draft cards are not counted.

## Layouts

| Template | Look |
| --- | --- |
| Classic Vertical | Red header, gold band, pale yellow QR panel. This is the TGIT design. |
| Red Bold | Tall red header and a pale yellow page. |
| Minimal | White page with a red stripe. |

## Developers

```bash
npm install
npm test
npm run check
npm run build
```

`npm run local:supabase` starts a small local stand-in for Supabase (PostgreSQL, Auth, the API, and file storage) on http://127.0.0.1:54321. It needs PostgreSQL and, the first time, Linux x64 so it can download Auth and PostgREST. It writes a `.env` if you do not already have one, including a local-only password. Then:

```bash
npm run seed
npm run dev
```

The print font is [Inter](https://github.com/rsms/inter), bundled under the SIL Open Font License (`static/fonts/OFL.txt`).

## Free plan limits worth knowing

- Supabase free: 500 MB database, 1 GB storage, 50,000 monthly active users. One admin is nowhere near that.
- Cloudflare Pages free: commercial use is allowed. The PDF is made in the browser so a request does not have to render it on the server.
- Keep videos inside the size limits above so storage lasts.
