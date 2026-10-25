# Assignment 2: Database-Driven Service Request Server (Express + MongoDB + Mongoose)

Assignment 1 rebuilt with **Express** (routers, middleware, controllers) and **MongoDB** through **Mongoose**.

```
Express ── Router ── Middleware ── Controller ──► Mongoose model ──► MongoDB
```

## Run

```bash
npm install
cp .env.example .env          # PORT, MONGODB_URI
npm run seed                  # 7 categories, 5 users, 14 requests
npm start                     # http://localhost:4000
# no MongoDB installed?  npm run dev:memory  (in-memory MongoDB, seeded automatically)
npm test                      # CRUD + aggregation + import test (19 checks)
npm run import:a1             # copy Assignment 1's requests.json into MongoDB
```

## Collections and models

| Collection | Model | Fields |
|---|---|---|
| `users` | `User` | name, email (unique), type (Student/Staff) |
| `categories` | `Category` | name (unique), code (unique) |
| `servicerequests` | `ServiceRequest` | requestId (REQ-101), requester (ref User), category (ref Category), description, priority, status, date |

The `ServiceRequest` schema enforces its rules itself: required fields, `minlength`, and enum values for priority and status, with clear messages. Requests are returned with `populate()`, so they include the requester's and the category's names.

## Endpoints

| Method | URL | Operation |
|---|---|---|
| POST | `/requests` | Create a request (`201`) |
| GET | `/requests` | Retrieve all (`?status=&priority=&category=`) |
| GET | `/requests/:id` | Retrieve by id (`400` malformed id, `404` unknown) |
| PUT | `/requests/:id` | Update (`runValidators`: an invalid status gives `422`) |
| DELETE | `/requests/:id` | Delete (`204`, then `404`) |
| GET | `/requests/stats/unresolved-by-category` | **Aggregation:** unresolved requests per category |
| GET, POST | `/categories`, `/users` | Lookups |

## Aggregation: unresolved requests in each category

```js
ServiceRequest.aggregate([
  { $match: { status: { $nin: ['Resolved', 'Closed'] } } },
  { $group: { _id: '$category', unresolved: { $sum: 1 } } },
  { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
  { $unwind: '$category' },
  { $project: { _id: 0, category: '$category.name', unresolved: 1 } },
  { $sort: { unresolved: -1 } }
]);
```

On the seed data this gives: IT Support 3, Maintenance 2, Transport 2, Facility Services 1, Library 1, Lost & Found 1.

## MongoDB Node.js driver

`scripts/import-from-a1.js` uses the official `mongodb` driver directly (`MongoClient`, `collection().findOneAndUpdate/insertOne`) rather than Mongoose. It moves the JSON file of Assignment 1 into the database: the old plain-text names and categories become documents in `users` and `categories`, and each request references them.
