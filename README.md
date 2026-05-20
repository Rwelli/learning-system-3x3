# Learning System 3x3

This project is a learning system for solving a system of three linear equations with three unknowns.

## Project structure

- `frontend`: user interface files
- `backend`: server-side files
- `backend/db`: database configuration and SQL files

## Technologies used

- HTML
- CSS
- JavaScript
- Node.js
- Vite
- PostgreSQL

## Requirements

Before running the project, make sure you have installed:

- Node.js
- npm
- PostgreSQL

## Database setup

Create a PostgreSQL database named:

```text
learn_systems
```

Then run the SQL files from the `backend/db` folder:

```bash
psql -U postgres -d learn_systems -f backend/db/schema.sql
psql -U postgres -d learn_systems -f backend/db/seed.sql
```

The database connection settings are in:

```text
backend/db/config.js
```

Default settings:

```text
database: learn_systems
user: postgres
password: 1234
```

## How to run the backend

Open a terminal in the main project folder and run:

```bash
cd backend
npm install
node server.js
```

## How to run the frontend

Open another terminal in the main project folder and run:

```bash
cd frontend
npm install
npm run dev
```

After running the frontend, open the local link shown in the terminal, usually:

```text
http://localhost:5173
```

## Important note

Do not use:

```bash
npm start
```

because the project currently does not have a `start` script in `package.json`.

Use:

```bash
npm run dev
```

for the frontend, and:

```bash
node server.js
```

for the backend.
