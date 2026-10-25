# Assignment 1: Basic Service Request Server (Node.js only)

A service request server built with **only Node.js core modules**: `http`, `url`, `fs`, `path`, `events` and streams. It uses no Express, MongoDB, Mongoose, Angular or React. Its purpose is to show the work that Express and a database will take over in Assignment 2.

```
Client → HTTP request → Node.js http server → URL processing (router.js) → File System (requests.json) → JSON response
```

## Run

```bash
npm start      # http://localhost:3000   (PORT=xxxx npm start to change the port)
npm test       # starts the server on a copy of the data and checks all 14 cases
```

No `npm install` is needed: there are no dependencies.

## Endpoints

| Method | URL | Result |
|---|---|---|
| GET | `/requests` | `200 { count, data: [...] }`; optional filters `?category=&status=&priority=` (read with the URL module) |
| GET | `/requests/:id` | `200 { data }`, `400` if the id is not like `REQ-101`, `404` if it does not exist |
| POST | `/requests` | `201 { data }` plus a `Location` header; `400` for bad JSON, `422` for invalid fields, `413` if the body is over 1 MB |
| GET | `/requests/export` | the raw JSON file, **streamed** with `fs.createReadStream().pipe(res)` |
| any other | | `404` invalid URL, `405` + `Allow` header for a wrong method |

POST body:

```json
{ "name": "Ali Raza", "category": "Transport", "description": "Bus route 4 was 40 minutes late.", "priority": "High" }
```

- **Generated fields:** the server sets `id` (`REQ-104`, ...), `date` (ISO) and `status` (`Submitted`).
- **Allowed values:** category must be IT Support, Maintenance, Transport, Library, Lost & Found, Classroom & Equipment or Facility Services. Priority must be Low, Medium, High or Urgent.

## How each topic is used

| Topic | Where |
|---|---|
| HTTP server | `server.js`: `http.createServer` |
| URL module | `src/router.js`: `new URL(req.url, ...)`, `pathname` split into segments, `searchParams` for filters |
| File System | `src/requestStore.js`: `fs/promises` `readFile`/`writeFile`/`rename`; the file is created if it is missing |
| Streams | the request body is read chunk by chunk (`req.on('data')`); `/requests/export` pipes a read stream; the log is written with `fs.createWriteStream` |
| Events and the event loop | `src/events.js` EventEmitter: `request:created` is emitted after saving, and `src/logger.js` listens and writes to `logs/activity.log`; `res.on('finish')` logs every request |
| Callbacks and promises | async/await on top of the non-blocking fs APIs |

**Safe writes:**
- POSTs are queued one after another, so 5 simultaneous POSTs still get unique ids and none are lost.
- Each save writes a temporary file and then renames it, so a crash can never leave half-written JSON.
