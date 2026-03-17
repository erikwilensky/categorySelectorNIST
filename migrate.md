## Local setup

1. Install dependencies:
   - `npm install`

2. Create environment file:
   - Copy `.env.local` values into your own `.env.local` if needed.
   - Make sure your Supabase URL and anon key are present and valid.

3. Apply the database schema in Supabase (do **not** run from this app):
   - Open the Supabase SQL editor for your project.
   - Paste the contents of `supabase-schema.sql`.
   - Run the script to create tables and seed the `factors` data.

4. Run the dev server:
   - `npm run dev`
   - Open the shown `http://localhost:...` URL in your browser.

Once these steps are done, the app should be ready to use against your Supabase project.