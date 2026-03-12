# akaal-psychiatry-office

Admin portal for Akaal Psychiatry, PLLC.

- **Tenant**: `akaal-psychiatry`
- **Public site**: [akaal-psychiatry](https://github.com/unixta-healthcare/akaal-psychiatry)
- **Auth**: Google OAuth + JWT session cookie
- **Data**: Markyy (GHL) for contacts/appointments; Supabase for settings/blog/users

## Dev
```bash
npm install && npm run dev  # -> /admin/login
```

---

## 2025 — Route Restructure + CRM Module (commit 7b473f3a)

### Changes
- **Strip `/admin` prefix**: All routes moved from `src/app/admin/*` → `src/app/*`
  - Login: `/admin/login` → `/login`
  - Dashboard: `/admin` → `/` (root)  
  - All pages: `/admin/contacts`, `/admin/appointments`, etc. → `/contacts`, `/appointments`, etc.
  - All API routes: `/api/admin/*` → `/api/*`
- **Root layout merged**: `src/app/layout.tsx` now conditionally renders sidebar (replaces nested `admin/layout.tsx`)
- **Middleware updated**: Now guards all routes except `/login` and `/api/auth/**`
- **CRM module added**: `src/lib/modules/crm/contacts.ts` — reads from Supabase `contacts` table (Markyy syncs in, portal reads from DB)
- **Contacts API rewritten**: `GET /api/contacts` now uses `listContacts()` from CRM module, not Markyy GHL directly

### Architecture compliance
- Contacts: Supabase universal table ✅ (was Markyy direct ❌)
- Appointments: GHL via `@/lib/ghl` (no Supabase `events` data for Akaal yet — mark TODO)
- Inquiries: GHL form submissions (GHL is appropriate source for this)
- Messages: GHL conversations (live data, appropriate)
- Blog: Supabase `blog_posts` ✅ (unchanged)
