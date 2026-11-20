# TGIT Cards

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
4. Paste `supabase/migrations/20261119120000_leads_templates.sql` and run that too. It adds leads, templates and the v8 card fields. Both files are safe to run again.

This creates companies, cards, products, templates, leads and view counts. Visitors can only read cards that are enabled, and only when that company is active. Only the super admin can change anything. The anon key cannot insert leads; the site does that through `/api/leads`.

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
- Company **TGIT Pte Ltd**, #08-01, 101 Eunos Avenue 3, Singapore 409538, +65 80151060, https://tgitsolutions.com. The postcode 409538 matches the source PDF and is still pending confirmation.
- Six real services, and the tagline “Transforming IT into reality”.
- The card for **Manoharan Pethappan**, IT Manager, Information Technology, slug `manoharan`, email manoharan@tgitsolutions.com, phone +65 8015 1060.
- The company mailbox `support@tgitsolutions.com` stays on the company record and is not printed on the card.
- The TGIT logo and the looping header video in Storage.

You can delete `SUPER_ADMIN_PASSWORD` from `.env` after this. The running site does not need the password. To change the password later, use Supabase → Authentication → Users.

If you would rather create the user by hand: Authentication → Users → Add user → turn on Auto Confirm. Use the same email as `SUPER_ADMIN_EMAIL`, then run `npm run seed` again so the profile is marked super admin.

## 5. Try it on your computer

```bash
npm run dev
```

Open http://localhost:5173 and sign in. You should see Overview, the company, and Manoharan’s card. The public page is http://localhost:5173/c/manoharan.

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
3. Cloudflare shows a CNAME target such as `tgit-cards.pages.dev`.
4. At the DNS host for `tgitsolutions.com` (Cloudflare DNS, or whoever hosts the domain today), add:

| Type | Name | Target |
| --- | --- | --- |
| CNAME | `cards` | the `*.pages.dev` hostname Cloudflare showed you |

5. Wait until the custom domain in Pages says Active. HTTPS is turned on for you.

If `tgitsolutions.com` already uses Cloudflare DNS, Pages can add this record itself when you attach the domain.

Leave the website at `tgitsolutions.com` where it is. Only the `cards` name moves.

## Using the admin

Sign in at `/login`. The sidebar has Overview, Contacts, Analytics, Assets, Templates, Cards, Companies, Settings and Help.

- **Overview** shows how many cards and companies you have, views, saved contacts and leads.
- **Contact Manager** lists people who used Exchange Contacts. Search, edit the note, delete, or download a CSV.
- **Analytics** shows views, saves and clicks per day, plus country and city when location tracking is on. Download a CSV from the same page.
- **Asset Library** lists files in the media bucket. Upload, copy the public URL, or delete. Videos are capped at 8 MB.
- **Templates** holds TGIT Classic v8 as the company default. New cards start from that default.
- **Companies** stores the address, phone, email, website, about text, mission, logo, colours, products, social links, and optional video. An optional UEN is shown on the card only when it is filled in. Leave it empty for TGIT.
- **Cards** is the list. Search by name, filter by company or by Ready / Draft, and see labels. Duplicate copies a card. Open a card to use the wizard: **Build**, **Customize**, **Set-up**, with Back, Next and Save & Share, and a live phone preview. Customize offers TGIT palette presets only. The short URL can be edited until the first save, then it is locked.
- **Settings** sets the organisation defaults for two-way contact sharing and IP location tracking.
- **Help** is a short static guide.

A card that is not enabled, or that belongs to an inactive company, is hidden from the public link.

### Colours

Company colours drive the public card and the print PDF. Customize on a card offers TGIT palette presets only: red, gold and pale yellow. The print PDF keeps the company palette.

Red is used for large headings on white, for buttons, and for the 12px tagline. Gold and pale yellow are for shapes, not for text. Icon circles use a pale red tint (`#FFE5E5`). Do not introduce blue.

### Video

On a company, open **Media**:

- **Intro / product video:** upload an MP4 up to **8 MB**, or paste a YouTube or Vimeo link. Other websites are rejected. Add a poster image if you want a picture before play. “Muted autoplay” starts the video only after it scrolls into view, with the sound off.
- **Header video:** a looping MP4 up to **8 MB** (or a GIF up to **3 MB**), clipped into the red wave on the Classic card. Add a poster image. The printed card uses that poster with a red tint. Visitors who prefer reduced motion see the poster instead of the video. A card can upload its own header video; otherwise it uses the company’s.

A card can have its own intro video. If it does not, the company’s video is shown. Video is never placed on the print PDF.

Supabase’s free plan includes 1 GB of file storage. Keep clips short (about 20–30 seconds). Logos should be PNG or JPEG under 2 MB.

### Print PDF

**Print card PDF** downloads a two-page file, 55 mm wide and 90 mm tall. It is built in the browser, so it stays inside Cloudflare’s free plan. The company support email is not printed on the card.

### Public card

The public page is the v8 card. The front plays for about 6 seconds, flips to the back for about 12 seconds, then flips back and repeats. Only the header video moves on the back; the QR, services and footer stay still. A tap flips it by hand. Visitors who prefer reduced motion see the poster and no automatic flip. A red **Exchange Contacts** button opens a short form (name, email and company are required).

### QR code

Each card’s QR code opens `https://cards.tgitsolutions.com/c/<slug>` (or whatever `PUBLIC_BASE_URL` is). Templates are Black, Dark red and Logo in the centre. Every template uses error correction H. Download PNG, SVG or PDF from the card editor.

### Save contact

**Save Contact** downloads a `.vcf` file. Phones import the name, title, company, phone, email, website, address and the card link.

### Counts

Opening a public card counts a view. Downloading the contact counts a save. An exchanged contact counts a lead. Country and city are stored only when Track IP location is on, using Cloudflare’s `cf-ipcountry` and `cf-ipcity` headers. The IP address is not stored. Draft cards are not counted.

## Layouts

| Template | Look |
| --- | --- |
| Classic Vertical | TGIT Classic v8. Looping header, red wave, gold line, flip to services. This is the TGIT design. |
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

The webfont is [Selawik](https://github.com/microsoft/Selawik), metric-compatible with Segoe UI and bundled under the SIL Open Font License (`static/fonts/OFL.txt`). The page font stack is Selawik, then Segoe UI, then Arial.

## Free plan limits worth knowing

- Supabase free: 500 MB database, 1 GB storage, 50,000 monthly active users. One admin is nowhere near that.
- Cloudflare Pages free: commercial use is allowed. The PDF is made in the browser so a request does not have to render it on the server.
- Keep videos inside the size limits above so storage lasts.
