# Google Calendar Sync Setup

1. Copy env file:
```powershell
Copy-Item .env.example .env
```

2. Set these values in `backend/.env`:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (example: `http://localhost:3000/google-calendar/callback`)

3. Run migration on existing database:
```sql
SOURCE backend/sql/migration_2026_04_30_google_calendar_sync.sql;
```
or:
```powershell
mysql -u <user> -p < backend/sql/migration_2026_04_30_google_calendar_sync.sql
```

4. Restart backend:
```powershell
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

5. Start frontend:
```powershell
cd frontend
npm run dev
```

6. Open `http://localhost:3000/taskcalendar` and click `Connect Google Calendar`.
