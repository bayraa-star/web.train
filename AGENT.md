# AGENT.md

## Scope

This repository is a two-app OCR labeling system under `web.train/`:

- `web.train/api`: Express + Mongoose backend, transpiled with Babel
- `web.train/web`: Create React App frontend

Most real work happens inside those two subdirectories. The repo root contains shared documentation and the Postman collection.

## Current Product Shape

The current product is a role-based image labeling workflow:

1. `admin` creates users and jobs, uploads raw images, and assigns them to a labeler
2. `labeler` types plate text and submits it
3. `examiner` approves or declines the submitted text
4. approved items generate final annotation artifacts
5. admin can review progress, trash, and dataset exports

Current roles:

- `admin`
- `labeler`
- `examiner`

Current file statuses:

- `uploaded`
- `labeled`
- `approved`
- `deleted`

## Repo Map

### Backend

- Entry point for worker process: `web.train/api/src/server.js`
- PM2 cluster entry: `web.train/api/cluster.js`
- Routes: `web.train/api/src/routes/*.js`
- Controllers: `web.train/api/src/controllers/*.js`
- Services: `web.train/api/src/services/*.js`
- Models: `web.train/api/src/models/*.js`
- Validators: `web.train/api/src/validators/*.js`
- Shared helpers: `web.train/api/src/utils/*.js`

Important backend modules:

- `src/controllers/file.js`
  - upload flow
  - label / approve / decline
  - soft-delete to trash
  - progress dashboard
- `src/controllers/dataset.js`
  - server-side dataset export jobs
- `src/services/job.js`
  - role-aware job visibility
- `src/services/user.js`
  - login, hashing, user delete safety checks

### Frontend

- Entry point: `web.train/web/src/index.js`
- Main workspace: `web.train/web/src/pages/Home.jsx`
- API client: `web.train/web/src/providers/api.js`
- Auth/session provider: `web.train/web/src/providers/app.js`
- Admin pages:
  - `src/pages/components/AdminProgressSection.jsx`
  - `src/pages/components/UserCreateSection.jsx`
  - `src/pages/components/UserManagementSection.jsx`
  - `src/pages/components/UploadSection.jsx`
  - `src/pages/components/JobManagementSection.jsx`
  - `src/pages/components/TrashSection.jsx`
  - `src/pages/components/DatasetDownloadSection.jsx`
- Labeler page:
  - `src/pages/components/LabelingSection.jsx`
- Examiner page:
  - `src/pages/components/ExaminerSection.jsx`

## Router Shape

### Frontend

The app uses:

- `/login`
- `/logout`
- `/home/*`

`/home/*` is role-driven:

- `admin`
  - `/home/dashboard`
  - `/home/users`
  - `/home/uploads`
  - `/home/trash`
  - `/home/dataset`
- `labeler`
  - labeling workspace only
- `examiner`
  - examiner workspace only

### Backend

Mounted route groups in `src/server.js`:

- `/user`
- `/file`
- `/root`
- `/job`
- `/dataset`
- `/uploads` static files

## Auth And Access

### JWT

- login: `POST /user/login`
- frontend stores JWT in browser storage
- expired or invalid JWT redirects user back to `/login`
- request auth is enforced through `src/validators/_common.js`
- current implementation uses `jwt.verify(...)`, not just decode

### Basic Auth

Used only for:

- `POST /user`

Credentials come from API `.env`:

- `BASIC_AUTH_USERNAME`
- `BASIC_AUTH_PASSWORD`

Frontend admin user creation uses explicit Basic Auth and does not go through the JWT interceptor.

## Storage Model

Uploads are no longer tied to the API working directory. The real filesystem root is configurable.

Environment:

- `UPLOADS_ROOT`

If `UPLOADS_ROOT` is not set, the backend falls back to `web.train/api/uploads`.

Important behavior:

- public URLs still stay under `/uploads/...`
- real files may live anywhere, for example `/media/web-train/uploads`
- uploaded image filenames are replaced with UUID names
- original uploaded names are stored in `originalName`

Generated annotation files:

- `<image>.txt`
- `labels.csv`

These are written only for approved items, beside the image inside the assigned labeler/job storage tree.

## Commands

Run commands from the app subdirectory, not the repo root.

### Backend

- install: `npm install`
- dev: `npm run dev`
- build: `npm run build`
- start: `npm run start`
- stop: `npm run stop`
- restart: `npm run restart`

Notes:

- `npm run start` starts `cluster.js`
- `cluster.js` forks workers that load `dist/server.js`
- set `CLUSTER_WORKERS=<count>` to control worker count

### Frontend

- install: `npm install`
- dev: `npm run dev`
- build: `npm run build`
- start: `npm run start`
- stop: `npm run stop`
- restart: `npm run restart`

## Verified State

These are currently true and should replace older assumptions:

- backend builds successfully with `npm run build`
- frontend builds successfully with `npm run build`
- frontend is no longer a simple root-upload UI
- `react-scripts` is installed correctly
- admin menu exists and is active
- `/job` and `/dataset` are real backend route groups
- trash and dataset export are real product features

## Key API Behavior

### Files

Important endpoints:

- `POST /file/upload`
- `POST /file/table`
- `PUT /file/label/:id`
- `PUT /file/trash/:id`
- `PUT /file/approve/:id`
- `PUT /file/decline/:id`
- `GET /file/progress`
- `DELETE /file/:id`

Behavior notes:

- `PUT /file/label/:id`
  - labeler can submit a new label
  - labeler can also update an item already waiting for examiner review
- `PUT /file/trash/:id`
  - labeler-only soft delete
  - moves item to `status: "deleted"`
  - does not remove the original image from disk
- `DELETE /file/:id`
  - admin-only hard delete
  - removes file record and underlying image

### Jobs

- admins see all jobs
- labelers only see jobs that already have files assigned to them
- deleted files are excluded from labeler-assigned job discovery

### Dashboard

- per-labeler progress is computed from Mongo
- deleted items are excluded from progress totals
- progress can be filtered by `jobId`

### Dataset Export

Dataset export is server-side, not browser-side.

Routes:

- `POST /dataset/export`
- `GET /dataset/export/:id`

Export scopes:

- `approved`
- `all`

Behavior:

- export jobs are stored in Mongo so progress works correctly even with clustered API workers
- backend copies files into a temporary export directory
- exported images are flattened into the zip root, not grouped by task or labeler folder
- backend creates sibling `.txt` files and one combined root `labels.csv` for approved items
- backend zips the export directory
- frontend polls the export status and only shows the download button when ready

## Frontend Workflow Notes

### Admin

- Dashboard: labeler progress by job
- Users: create, edit, delete users
- Uploads & Jobs: create job, upload files, manage jobs
- Trash: review soft-deleted items
- Dataset: start and download dataset exports

### Labeler

- can pick assigned job
- can switch view between `uploaded`, `labeled`, and `approved`
- submitted items are editable until examiner approval
- can move editable items to trash
- declined items return to `uploaded` and are shown as resubmission work

### Examiner

- picks a job
- reviews `labeled` items
- can approve or decline

## Known Risks And Constraints

- This repo still contains legacy names such as `violation` in package metadata and some old files
- Do not assume older files under `web.train/web/src/pages` are active; confirm from `src/index.js` and `Home.jsx`
- Because the backend runs in cluster mode, do not store shared job state only in memory if it needs to be polled later
- Upload changes must account for:
  - Mongo file records
  - filesystem placement
  - sibling `.txt`
  - `labels.csv`
  - static file serving under `/uploads`

## Working Rules For Agents

- Check `git status --short` before editing
- Confirm active frontend routes from `web.train/web/src/index.js` and `Home.jsx`
- Prefer the existing route -> controller -> service -> model structure on the backend
- Use validators or `authenticate(...)` for protected routes
- Treat upload-path work carefully because files may now live outside the repo under `UPLOADS_ROOT`
- For new long-running work, prefer persistent state over in-memory state because the API is clustered
- Verify backend changes with `npm run build` in `web.train/api`
- Verify frontend changes with `npm run build` in `web.train/web`

## Suggested Starting Points

For backend work:

- `web.train/api/src/server.js`
- matching route in `src/routes`
- controller in `src/controllers`

For frontend work:

- `web.train/web/src/index.js`
- `web.train/web/src/pages/Home.jsx`
- relevant component under `src/pages/components`

For API verification:

- `postman/web-train-api.postman_collection.json`
