# web.train

`web.train` is a role-based image labeling system for OCR-style plate annotation.

The project is split into:

- `web.train/api`: Express + MongoDB API
- `web.train/web`: React frontend
- `postman/web-train-api.postman_collection.json`: importable Postman collection

The current workflow is:

1. `admin` creates users and jobs, then uploads raw images into a job and assigns them to a labeler.
2. `labeler` opens an assigned job, types the plate text, and submits it for review.
3. `examiner` reviews the submitted text, then approves or declines it.
4. On approval, the API writes the final label into the database, a sibling `.txt` file, and `labels.csv`.

## Main Features

- JWT login with automatic logout on token expiry
- Three roles: `admin`, `labeler`, `examiner`
- Admin menu:
  - `Dashboard`
  - `Users`
  - `Uploads & Jobs`
  - `Dataset`
- Batch-based work management with `jobs`
- Large-queue pagination for labeling and examining
- Examiner approval/decline loop
- Declined items return to the labeler queue
- Labeler can still update a submitted label while it is waiting for examiner review
- Uploaded image filenames are stored with generated UUID filenames to avoid collisions
- Final OCR text is normalized to uppercase before save

## Roles

### `admin`

- Log in with username/password
- See dashboard progress by job
- Create users from the frontend or API
- Manage users
- Create and manage jobs
- Upload raw images and assign them to a labeler
- Delete jobs and users only when there are no linked files

### `labeler`

- Log in with username/password
- See only jobs that have files assigned to that labeler
- Choose one assigned job
- Switch between:
  - `Waiting for Labeling`
  - `Submitted to Examiner`
  - `Approved`
- Enter uppercase OCR text such as `0659 УНГ`
- Update already-submitted labels until the examiner approves them
- See declined items highlighted and resubmit them

### `examiner`

- Log in with username/password
- Choose a job to review
- See submitted labels waiting for review
- Approve labels
- Decline labels and send them back to the labeler

## Status Flow

File status is stored in MongoDB with three active states:

- `uploaded`
  - raw image assigned to a labeler
  - waiting for OCR entry
- `labeled`
  - labeler has submitted OCR text
  - waiting for examiner review
- `approved`
  - examiner approved the final OCR text
  - `.txt` and `labels.csv` artifacts are written

Decline behavior:

- examiner declines a `labeled` item
- item returns to `uploaded`
- previous OCR text stays in the record as a draft
- labeler sees it as a declined/resubmission task

## Project Structure

```text
/opt/webs/web.train
├── README.md
├── postman/
│   └── web-train-api.postman_collection.json
└── web.train/
    ├── .gitignore
    ├── api/
    │   ├── src/
    │   ├── dist/
    │   └── uploads/
    └── web/
        ├── public/
        └── src/
```

Important frontend files:

- `web.train/web/src/index.js`: app routing and protected routes
- `web.train/web/src/pages/Home.jsx`: role-based workspace and admin menu
- `web.train/web/src/pages/components/UploadSection.jsx`: admin upload flow
- `web.train/web/src/pages/components/AdminProgressSection.jsx`: admin dashboard
- `web.train/web/src/pages/components/UserCreateSection.jsx`: frontend user creation with Basic Auth
- `web.train/web/src/pages/components/UserManagementSection.jsx`: user management
- `web.train/web/src/pages/components/JobManagementSection.jsx`: job management
- `web.train/web/src/pages/components/LabelingSection.jsx`: labeler workspace
- `web.train/web/src/pages/components/ExaminerSection.jsx`: examiner workspace

Important API files:

- `web.train/api/src/server.js`: Express server and route registration
- `web.train/api/src/controllers/file.js`: upload, queue, label, approve, decline logic
- `web.train/api/src/services/job.js`: job access scoping
- `web.train/api/src/services/user.js`: login and user management logic
- `web.train/api/src/validators/*`: auth and access control

## Requirements

- Node.js and npm
- MongoDB
- PM2 for production-style process management

## Environment

The API reads environment variables from:

- `web.train/api/.env`

Required values:

```env
DB=mongodb://localhost:27017/your_database
SECRET_KEY=replace-with-jwt-secret
BASIC_AUTH_USERNAME=replace-with-basic-auth-username
BASIC_AUTH_PASSWORD=replace-with-basic-auth-password
UPLOADS_ROOT=/media/web-train/uploads
```

Notes:

- `SECRET_KEY` is used for JWT signing and verification
- `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` are used only for `POST /user`
- `UPLOADS_ROOT` is the absolute filesystem path where uploaded images and generated label files are stored
- JWT expiry is currently `12h`

## Default Ports

- Frontend: `3305`
- API: `5001`

The frontend expects the API on `http://localhost:5001`.

## Install

### API

```bash
cd /opt/webs/web.train/web.train/api
npm install
```

### Frontend

```bash
cd /opt/webs/web.train/web.train/web
npm install
```

## Run In Development

### API

```bash
cd /opt/webs/web.train/web.train/api
npm run dev
```

### Frontend

```bash
cd /opt/webs/web.train/web.train/web
npm run dev
```

## Build

### API

```bash
cd /opt/webs/web.train/web.train/api
npm run build
```

### Frontend

```bash
cd /opt/webs/web.train/web.train/web
npm run build
```

## PM2 / Production Scripts

### API

```bash
cd /opt/webs/web.train/web.train/api
npm run start
npm run stop
npm run restart
```

`npm run start` now starts `cluster.js`, which forks worker processes for `dist/server.js`. You can limit workers with `CLUSTER_WORKERS=<count>`.

### Frontend

```bash
cd /opt/webs/web.train/web.train/web
npm run start
npm run stop
npm run restart
```

## Frontend Behavior

### Login

- all users must log in first
- token is stored in browser storage
- expired or invalid tokens redirect the user back to `/login`

### Admin Menu

The admin workspace is divided into:

- `Dashboard`
  - progress by job
  - per-labeler totals
  - first/last labeled timestamps
  - first/last approved timestamps
- `Users`
  - create user
  - edit user
  - delete user
- `Uploads & Jobs`
  - create job
  - upload images into selected job
  - assign images to a labeler
  - edit job
  - delete job
- `Dataset`
  - start server-side dataset export
  - choose `labeled only` or `all dataset`
  - poll export progress
  - download the finished zip

### Labeler Workspace

- can select assigned job
- can view queues by status
- queue is paginated
- plate input is uppercased automatically
- `Enter` submits the label
- focus moves through work items
- declined items are shown with a red warning and red resubmit button

### Examiner Workspace

- chooses a job first
- sees `labeled` items waiting for review
- can edit OCR text before approval
- can approve or decline
- queue is paginated

## Storage and File Naming

Uploaded task images are stored under:

- `<UPLOADS_ROOT>/tasks/<labelerId>/`

Generic file uploads can also be stored under:

- `<UPLOADS_ROOT>/<rootId>/`

Behavior:

- uploaded task image filenames are replaced with generated UUID filenames
- original uploaded name is stored separately as `originalName`
- this prevents collisions when source files share the same name
- public URLs still stay under `/uploads/...` even when the real files live on another disk such as `/media`

Git ignore:

- `web.train/.gitignore` ignores `/api/uploads`

## Generated Annotation Files

Final artifacts are generated only when the examiner approves a label.

For each approved image:

- `<image-name>.txt` is written beside the image
- `labels.csv` is created or updated in the same directory

Example:

```text
<UPLOADS_ROOT>/tasks/<labelerId>/123e4567-e89b-12d3-a456-426614174000.png
<UPLOADS_ROOT>/tasks/<labelerId>/123e4567-e89b-12d3-a456-426614174000.txt
<UPLOADS_ROOT>/tasks/<labelerId>/labels.csv
```

`labels.csv` format:

```csv
123e4567-e89b-12d3-a456-426614174000,0659 УНГ
```

## Main API Routes

### Authentication

- `POST /user/login`

### User Management

- `POST /user`
  - Basic Auth required
- `POST /user/table`
- `PUT /user/:id`
- `DELETE /user/:id`

### Jobs

- `POST /job`
- `POST /job/table`
- `PUT /job/:id`
- `DELETE /job/:id`

### Labels

- `POST /root`
- `POST /root/table`

These remain available, but the current OCR workflow uses free-text plate entry rather than choosing a predefined label.

### Files / Workflow

- `POST /file/upload`
  - admin uploads task images into a job and assigns them to a labeler
- `POST /file/table`
  - queue listing with pagination/filtering
- `PUT /file/label/:id`
  - labeler submits or updates OCR text
- `PUT /file/approve/:id`
  - examiner approves final text
- `PUT /file/decline/:id`
  - examiner declines and returns item to labeler
- `DELETE /file/:id`

### Dashboard

- `GET /file/progress`
- `GET /file/progress?jobId=<jobId>`

### Dataset Export

- `POST /dataset/export`
  - admin-only
  - body: `{ "scope": "approved" }` or `{ "scope": "all" }`
- `GET /dataset/export/:id`
  - admin-only
  - returns export progress, status, and `downloadPath` when finished

### Health

- `GET /test`

## Postman

Import:

- `postman/web-train-api.postman_collection.json`

Collection variables include:

- `baseUrl`
- `basicUsername`
- `basicPassword`
- `adminToken`
- `labelerToken`
- `examinerToken`
- `adminUserId`
- `labelerUserId`
- `examinerUserId`
- `assignedToUserId`
- `jobId`
- `fileId`
- `plateText`

The collection covers:

- auth
- user creation and deletion
- job creation, listing, and deletion
- progress dashboard
- upload flow
- labeler queue flow
- examiner approve/decline flow
- dataset export flow

## Deletion Rules

User deletion is blocked when a file references that user as:

- `assignedTo`
- `labeledBy`
- `approvedBy`
- `declinedBy`

Job deletion is blocked when files are linked to that job.

## Performance Notes

- Labeler and examiner screens are paginated
- intended for large datasets such as 20,000+ images
- queue refresh happens automatically on an interval
- job-based filtering keeps progress reporting stable for completed batches

## Current Limitations

- some package metadata and legacy naming still use old `violation` names
- existing old records created before newer workflow fields may not display every newer status hint the same way
- labels are saved as free-text OCR strings, not as predefined category selections

## Recommended Setup Order

1. Configure `web.train/api/.env`
2. If you want uploads on a larger disk, set `UPLOADS_ROOT` to a directory on `/media` and move existing upload files there before restarting the API
3. Install dependencies in `api` and `web`
4. Start MongoDB
5. Start the API
6. Start the frontend
7. Log in as admin
8. Create labeler and examiner users
9. Create a job
10. Upload images and assign them to a labeler
11. Label as labeler
12. Review as examiner

## Verification

Recent local checks used during development:

- frontend `npm run build` passes
- API `npm run build` passes
