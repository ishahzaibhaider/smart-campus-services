# Smart Campus Service Management System

**CSC337 Advanced Web Technologies: Lab Assignments 1 to 4**

**Syed Shahzaib Haider Rizvi**, FA23-BAI-050, COMSATS University Islamabad

One real-world problem, built in four stages, each using only the technologies taught up to that point:

> **Build it → persist it → expose it → consume it**

| # | Folder | Stack | What it adds |
|---|---|---|---|
| 1 | [`assignment-1-node-server`](assignment-1-node-server) | Node.js `http`, `url`, `fs`, events, streams | Request server with hand-written routing and a JSON file store |
| 2 | [`assignment-2-express-mongodb`](assignment-2-express-mongodb) | Express, MongoDB, Mongoose | Database-backed CRUD, routers, middleware, aggregation, A1 data import |
| 3 | [`assignment-3-rest-api`](assignment-3-rest-api) | REST, JWT, CORS, helmet, rate limiting | Secure REST API with student/admin roles and a status workflow |
| 4 | [`assignment-4-angular-client`](assignment-4-angular-client) | Angular, TypeScript, RxJS | Student and administrator dashboards that use the Assignment 3 API |

```
Assignment 4  Angular client  ──HTTP/REST + JWT──►  Assignment 3  REST API  ──Mongoose──►  MongoDB (Assignment 2 data model)
```

## Quick start (full MEAN application)

```bash
# terminal 1 – API (in-memory MongoDB with sample data, no install needed)
cd assignment-3-rest-api && npm install && npm run dev:memory     # http://localhost:4000/api

# terminal 2 – Angular client
cd assignment-4-angular-client && npm install && npx ng serve     # http://localhost:4200
```

Log in as **shahzaib@student.campus.edu / Student@123** (student) or **admin@campus.edu / Admin@123** (administrator).

Each folder has its own README and automated tests.
