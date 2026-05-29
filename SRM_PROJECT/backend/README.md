# Backend

Simple PHP + MySQL backend for SRM login and registration.

## Setup

1. Create the database and seed users:
   - Open `backend/database/schema.sql` in phpMyAdmin or the MySQL CLI.
   - Run the script against MySQL (creates RDBMS schema tables with InnoDB constraints and seeding).
2. Update database credentials if needed:
   - `backend/config/db.php` reads `DB_HOST`, `DB_USER`, `DB_PASS`, and `DB_NAME` from the environment.
   - Defaults are `127.0.0.1`, `root`, empty password, and `srm_portal`.
   - Copy `backend/.env.example` to your preferred local env file if you want a quick reference.
3. Serve the `backend/` folder through Apache.
4. Point the frontend login form at `/SRM_PROJECT/backend/api/login.php` or set `VITE_API_BASE_URL`.
5. If your Apache document root is different, update `VITE_API_BASE_URL` so the frontend can reach `backend/api`.

## Default test users

- `admin@srm.local` / `password123`
- `supplier@srm.local` / `password123`

## Available endpoints

- `POST /backend/api/login.php`
- `POST /backend/api/register.php`
- `POST /backend/api/logout.php`
- `GET /backend/api/me.php`
- `GET /backend/api/rfqs.php` (List all RFQs)
- `GET /backend/api/rfqs.php?id={id}` (Fetch single RFQ with line items)
- `POST /backend/api/rfqs.php` (Create RFQ with items)
- `DELETE /backend/api/rfqs.php?id={id}` (Delete RFQ)
- `GET /backend/api/bids.php` (List all supplier quotes with line items)
- `POST /backend/api/bids.php` (Submit supplier quote & line item rates)
- `DELETE /backend/api/bids.php?id={id}` (Delete supplier quote)

