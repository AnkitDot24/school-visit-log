# School Visit Log

Field staff log school visits from an Android app, including while offline. Visits are queued
on the phone first and synced to a Node.js + MongoDB API when a connection is available.

| Folder    | What it is                                                                       |
| --------- | -------------------------------------------------------------------------------- |
| `/server` | Express + Mongoose API (plain JavaScript, CommonJS), plus import and seed scripts |
| `/app`    | React Native app (Expo SDK 57, Expo Router), written in JavaScript/JSX            |

The database is built from the two source files in `server/data/`, so a fresh machine needs
nothing but Node and MongoDB.

## What you need

- **Node.js 18 or newer** and npm (built and tested on Node 24)
- **MongoDB 6 or newer** running locally on `127.0.0.1:27017`
- To run the app: an **Android phone with Expo Go** on the same Wi-Fi as the computer, or an
  **Android emulator**
- Optional: **[MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools)** —
  only needed for `npm run dump`, and `mongosh` only if you want to query the database by hand.
  Neither is required to import the data or run the project.

## Quick start

If you just want it running, this is the whole thing. Each step is explained below.

```bash
# 1. Make sure MongoDB is running on 127.0.0.1:27017

# 2. API + data
cd server
copy .env.example .env      # macOS/Linux: cp .env.example .env
npm install
npm run import:schools      # ~53,000 schools
npm run seed                # questionnaires + 3 demo users
npm start                   # http://localhost:4000/api

# 3. App, in a second terminal
cd app
npm install
npx expo start
```

## 1. Start MongoDB

The server expects a local MongoDB on the default port. You do **not** need to create the
`visit_log` database by hand — MongoDB creates it the first time the import writes to it.

- **Installed as a service (typical on Windows):** it is usually running already. Check with
  `Get-Service MongoDB` in PowerShell, and start it with `net start MongoDB` if it is stopped.
- **macOS with Homebrew:** `brew services start mongodb-community`
- **Docker:** `docker run -d --name visit-log-mongo -p 27017:27017 mongo:6`

If you have `mongosh` installed you can confirm it is listening:

```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

If you do not have `mongosh`, skip it — step 3 will fail with a clear connection error if
MongoDB is not reachable, which is just as good a check.

## 2. Configure the server

```bash
cd server
copy .env.example .env      # macOS/Linux: cp .env.example .env
npm install
```

`MONGODB_URI` is the only required variable; the server refuses to start without it. The
defaults in `.env.example` work as-is for a standard local MongoDB.

| Variable        | Default in `.env.example`             | Purpose                                                                             |
| --------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| `MONGODB_URI`   | `mongodb://127.0.0.1:27017/visit_log` | Database connection. Use `127.0.0.1`, not `localhost` — Node may resolve it to IPv6.  |
| `PORT`          | `4000`                                | Port the API listens on (bound to `0.0.0.0` so a phone on the LAN can reach it).      |
| `NODE_ENV`      | `development`                         | Shown in the startup log.                                                             |
| `LOG_TIME_ZONE` | `Asia/Kolkata`                        | Timezone used for log timestamps only. Visit months are always IST regardless.        |
| `CORS_ORIGINS`  | local dev origins                     | Browser origins allowed by CORS. The mobile app sends no `Origin`, so it is always allowed. |

Keep the database name as `visit_log`. `npm run dump` dumps that name specifically, so pointing
`MONGODB_URI` at a differently named database will leave you with an empty dump and an API that
reads from somewhere other than where you imported.

## 3. Import the data into your local database

Two source files ship with the repository, and two scripts load them. Run both from `server/`,
with MongoDB running and `.env` in place.

| Source file                       | Contents                                                 | Loaded by             |
| --------------------------------- | -------------------------------------------------------- | --------------------- |
| `server/data/schools.json`        | ~52,989 schools from the UDISE export (about 30 MB)      | `npm run import:schools` |
| `server/data/questionnaires.json` | One questionnaire per month for July–September 2026      | `npm run seed`         |

### 3a. Import the schools

```bash
npm run import:schools
```

This reads `data/schools.json` and, for every record, trims strings, collapses repeated inner
spaces, turns empty strings into `null`, renames `school_type` to `schoolType`, converts
`classFrom`/`classTo` to numbers, and drops the source `_id` and `slNo`. A record is skipped —
with the reason printed — if it has no `udiseCode`, `schoolName`, or district/block/cluster code,
if a code is non-numeric, or if its `udiseCode` already appeared earlier in the file. The
supplied file has none of those, so you should see zero skips.

Records are then upserted on `udiseCode` in batches of 1,000, and the `schools` indexes are
created. Expect output like:

```
Reading .../server/data/schools.json

Records in file: 52989
Inserted:  52989
Updated:   0
Unchanged: 0
Skipped:   0
Done in ...s
```

It takes a few seconds to a minute depending on the machine.

### 3b. Seed the questionnaires and demo users

```bash
npm run seed
```

This validates and loads `data/questionnaires.json` (rejecting duplicate months, duplicate
question IDs, and malformed question definitions before touching the database), then upserts the
three demo users. Expect:

```
Questionnaires: inserted 3, updated 0, unchanged 0
Users: inserted 3, updated 0, unchanged 0
```

The `visits` collection is not seeded — it is created the first time the app syncs a visit.

### Re-running, and loading your own files

Both scripts are idempotent: they upsert rather than insert, so running them again is safe and
changes nothing. On a second run the counts simply move to the `Unchanged` column.

Each accepts an optional path if you want to load a different file:

```bash
npm run import:schools -- ../path/to/other-schools.json
npm run seed -- ../path/to/other-questionnaires.json
```

Neither script deletes anything. To start completely clean, drop the database first — for
example `mongosh visit_log --eval "db.dropDatabase()"` — and re-run both.

### Check the import worked

The quickest check that needs no extra tools is to start the API (step 4) and call it. If you do
have `mongosh`:

```bash
mongosh visit_log --eval "['schools','questionnaires','users','visits'].forEach(c => print(c, db[c].countDocuments()))"
```

## 4. Start the API

```bash
npm start                   # or: npm run dev   (nodemon, restarts on file changes)
```

On success it logs the database it connected to, the URL, the allowed CORS origins and the
startup time. Then confirm the data is really there:

```bash
curl http://localhost:4000/api/health                 # -> {"status":"ok"}
curl "http://localhost:4000/api/schools?limit=2"      # -> 2 schools and a total of ~52989
curl http://localhost:4000/api/questionnaires/current # -> this month's questions
curl "http://localhost:4000/api/locations/districts"  # -> the district filter list
```

In PowerShell use `curl.exe` rather than `curl`, because `curl` is an alias for
`Invoke-WebRequest` and takes different arguments.

If `/api/schools` returns a `total` of `0`, the API is connected to a different database than
the one you imported into — check `MONGODB_URI` in `server/.env`.

## 5. Run the app

```bash
cd app
npm install
npx expo start
```

- **On a phone:** scan the QR code with Expo Go. The app works out the API address from the
  computer running Metro and calls port 4000 there, so there is usually nothing to configure.
- **On an emulator:** press `a`. The app falls back to `http://10.0.2.2:4000`, which is how the
  Android emulator reaches the host machine.
- **To point somewhere else:** create `app/.env` with
  `EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:4000` and restart `npx expo start`.

### Signing in

There is no password. Pick one of the three seeded demo users on the first screen; the choice is
remembered on the device.

| User ID | Name         | Role                |
| ------- | ------------ | ------------------- |
| `U1001` | Asha Patra   | Cluster coordinator |
| `U1002` | Ramesh Nayak | Cluster coordinator |
| `U1003` | Sunita Das   | Block officer       |

The **My visits** screen shows a connection indicator: *Online* (API answering), *No server*
(phone has a network but the API is unreachable) or *Offline* (no network at all).

### Trying the offline flow

Pick a school, fill in the visit form and submit while in aeroplane mode. The visit appears as
*Pending* in **My visits**. Turn the network back on and it syncs by itself — no button needed —
and turns *Synced*. Submitting the same visit twice can never create two records: the app
generates a `clientId` per visit and the server treats it as idempotent.

## Other commands

Run these from `server/`:

| Command                                | What it does                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run explain:report -- 2101 2026 9` | Prints `explain("executionStats")` for the block-summary aggregation (district, year, month). |
| `npm run dump`                         | Writes `dump/visit_log.archive.gz`, creating the folder if needed. Needs `mongodump` on your PATH, or set `MONGODUMP_PATH` to its full path. |

## If something does not work

**The server exits saying it cannot connect.** MongoDB is not running, or `MONGODB_URI` points
somewhere else. Start the service and confirm the URI in `server/.env`.

**The server exits saying `Missing required environment variable MONGODB_URI`.** You have not
created `server/.env` yet — copy it from `server/.env.example`.

**The app loads but no schools appear.** The import did not run, or it ran against a different
database. Check `curl "http://localhost:4000/api/schools?limit=2"` and re-run
`npm run import:schools` if the total is `0`.

**The visit form says there is no questionnaire for this month.** Questionnaires are seeded for
**July, August and September 2026** only, and the form always uses the current month in IST. If
you run this after September 2026, add a row for the current month to
`server/data/questionnaires.json` and re-run `npm run seed`.

**The phone cannot reach the server.** This is the usual one. The API binds `0.0.0.0`, so the
problem is almost always the host firewall — on Windows, allow Node.js through for *private*
networks. Check from the phone's browser by opening `http://<your-LAN-IP>:4000/api/health`. The
phone and computer must be on the same Wi-Fi, and the app shows *No server* rather than *Online*
when this is the case.

**`mongodump` or `mongosh` is not recognised.** The MongoDB Database Tools and the shell are
separate downloads from the server itself. Nothing in the setup above needs them — only
`npm run dump` does.
