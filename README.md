# School Visit Log

Field staff log school visits from an Android app, including while offline. Visits are queued
on the phone first and synced to a Node.js + MongoDB API when a connection is available.

| Folder    | What it is                                                                    |
| --------- | ----------------------------------------------------------------------------- |
| `/server` | Express + Mongoose API (plain JavaScript, CommonJS), plus import and seed scripts |
| `/app`    | React Native app (Expo SDK 57, Expo Router), written in JavaScript/JSX          |
| `/dump`   | `mongodump` archive of the `visit_log` database                                 |

## What you need

- **Node.js 18 or newer** and npm (built and tested on Node 24)
- **MongoDB 6 or newer** running locally on `127.0.0.1:27017`
- **[MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools)** — only if you
  want to restore the supplied dump (`mongorestore`) or take a new one (`mongodump`)
- To run the app: an **Android phone with Expo Go** on the same Wi-Fi as the computer, or an
  **Android emulator**

## 1. Start MongoDB

The server expects a local MongoDB. Either start the service you already have, or run one in Docker:

```bash
docker run -d --name visit-log-mongo -p 27017:27017 mongo:6
```

Check it is listening before going on:

```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

## 2. Run the server

```bash
cd server
cp .env.example .env        # Windows: copy .env.example .env
npm install
```

Now load the data. Pick **one** of the two options.

**Option A — restore the supplied dump** (fastest, gives you exactly the database that was handed in):

```bash
mongorestore --gzip --archive=../dump/visit_log.archive.gz
```

**Option B — build the database from the source files** in `server/data/`:

```bash
npm run import:schools      # loads data/schools.json into visit_log.schools
npm run seed                # loads data/questionnaires.json and the 3 demo users
```

Both scripts are idempotent — run them as many times as you like. They print how many records were
inserted, updated, left unchanged and skipped, and why anything was skipped.

Start the API:

```bash
npm start                   # http://localhost:4000/api   (npm run dev restarts on file changes)
```

Confirm it is up:

```bash
curl http://localhost:4000/api/health          # -> {"status":"ok"}
curl "http://localhost:4000/api/schools?limit=2"
```

### Environment variables (`server/.env`)

| Variable        | Default in `.env.example`             | Purpose                                                                       |
| --------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| `MONGODB_URI`   | `mongodb://127.0.0.1:27017/visit_log` | Database connection. Use `127.0.0.1`, not `localhost` — Node may resolve it to IPv6. |
| `PORT`          | `4000`                                | Port the API listens on (bound to `0.0.0.0` so a phone on the LAN can reach it). |
| `NODE_ENV`      | `development`                         | Shown in the startup log.                                                       |
| `LOG_TIME_ZONE` | `Asia/Kolkata`                        | Timezone used for log timestamps only. Business logic is always IST regardless. |
| `CORS_ORIGINS`  | local dev origins                     | Browser origins allowed by CORS. The mobile app sends no `Origin`, so it is always allowed. |

## 3. Run the app

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

The **My visits** screen shows a connection indicator: *Online* (API answering), *No server* (phone
has a network but the API is unreachable) or *Offline* (no network at all).

## Other commands

Run these from `server/`:

| Command                               | What it does                                                              |
| ------------------------------------- | ------------------------------------------------------------------------- |
| `npm test`                            | Unit tests for IST month handling, import cleaning and answer validation.  |
| `npm run explain:report -- 2101 2026 9` | Prints `explain("executionStats")` for the block-summary aggregation.    |
| `npm run dump`                        | Writes `dump/visit_log.archive.gz`. Set `MONGODUMP_PATH` if `mongodump` is not on your PATH. |

## If something does not work

**The phone cannot reach the server.** This is the usual one. The API binds `0.0.0.0`, so the
problem is almost always the host firewall — on Windows, allow Node.js through for *private*
networks. Check from the phone's browser by opening `http://<your-LAN-IP>:4000/api/health`. The
phone and computer must be on the same Wi-Fi, and the app shows *No server* rather than *Online*
when this is the case.

**The visit form says there is no questionnaire for this month.** Questionnaires are seeded for
**July, August and September 2026** only, and the form always uses the current month in IST. If you
run this after September 2026, add a row for the current month to `server/data/questionnaires.json`
and re-run `npm run seed`.

**`mongorestore` is not recognised.** The MongoDB Database Tools are a separate download from the
server itself. Either install them and reopen your terminal, or skip the dump and use Option B
above, which needs only Node.

**The server exits saying it cannot connect.** MongoDB is not running, or `MONGODB_URI` points
somewhere else. Confirm with the `mongosh` ping in step 1.
