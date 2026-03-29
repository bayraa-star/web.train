# AGENT.md

## Scope

This repository is a two-app project under `web.train/`:

- `web.train/api`: Express + Mongoose backend, transpiled with Babel
- `web.train/web`: Create React App frontend with Tailwind, Ant Design, and Axios

The repo root is mostly a wrapper. Most work happens inside those two subdirectories.

## Repo Map

### Backend

- Entry point: `web.train/api/src/server.js`
- Routes: `web.train/api/src/routes/*.js`
- Controllers: `web.train/api/src/controllers/*.js`
- Services: `web.train/api/src/services/*.js`
- Models: `web.train/api/src/models/*.js`
- Validators: `web.train/api/src/validators/*.js`
- Shared helpers: `web.train/api/src/utils/*.js`

The backend follows a route -> controller -> service -> model pattern. The common list endpoint behavior is implemented by `web.train/api/src/utils/db.js` and returns:

- `total`
- `skip`
- `limit`
- `offset`
- `items`

### Frontend

- Entry point: `web.train/web/src/index.js`
- API client: `web.train/web/src/providers/api.js`
- Shared formatting/helpers: `web.train/web/src/providers/*.js`
- Reusable inputs/components: `web.train/web/src/inputs`, `web.train/web/src/components`, `web.train/web/src/template`
- Pages: `web.train/web/src/pages`

The currently mounted frontend is much smaller than the file tree suggests. `src/index.js` only mounts `/home` and redirects `*` to `/home`. Many other layouts/pages appear to be legacy or partially disconnected.

## Commands

Run commands from the app subdirectory, not the repo root.

### Backend

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- PM2 start: `npm run start`

Verified during inspection:

- `web.train/api` builds successfully with `npm run build`

### Frontend

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- PM2 start: `npm run start`

Verified during inspection:

- `web.train/web` build currently fails because `react-scripts` is not available in the local install
- `web.train/web/package.json` currently declares `react-scripts` as `^0.0.0`, which is likely accidental and should be treated as suspicious before doing frontend dependency work

## Environment

Backend `.env` currently expects these keys:

- `DB`
- `SECRET_KEY`
- `MEDIAMTX_API_URL`

Do not print or commit secret values. Document names only.

## Backend Notes

- `web.train/api/src/server.js` mounts `/user`, `/file`, and `/root`
- MongoDB connection is created during server startup
- Static files are served from `/uploads` and `/static`
- `agenda` exists but scheduled jobs are commented out in startup
- User-facing CRUD endpoints rely on validators to decode auth and stamp audit fields

### Auth Behavior

- Validators decode JWT from the `Authorization` header in `web.train/api/src/validators/_common.js`
- They use `jwt.decode(...)`, not `jwt.verify(...)`
- Access control is role-based after decode
- If a route skips validators, it also skips auth/audit handling

This matters when adding routes. In this codebase, validators do more than input validation.

### File Upload Flow

`web.train/api/src/controllers/file.js` does more than store uploads:

- Saves uploaded files to `uploads/<root>/`
- Stores metadata in Mongo via the `file` model
- Creates a sibling `.txt` file per upload
- Appends `<id>,<plate>` rows to `labels.csv`

Any change to upload semantics must account for both filesystem side effects and Mongo persistence.

## Frontend Notes

- Global Axios base URL is set from `API_ROOT` in `web.train/web/src/index.js`
- `mainApi` in `web.train/web/src/providers/api.js` attaches bearer token and language headers
- Production API target is hardcoded in `web.train/web/src/defines.js`
- `Home.jsx` currently drives the main flow by listing roots and rendering upload widgets per root

### Current Product Shape

The active UI appears focused on:

- fetching root records from `/root/table`
- creating new roots with `/root`
- uploading files into a selected root with `/file/fs/:root`

Large parts of the frontend tree look inherited from a broader admin app and may not be live in the current router.

## Known Issues And Risks

These were verified directly from the current tree:

- `web.train/api/src/server.js` imports `{ log }` from `web.train/api/src/utils`, but `web.train/api/src/utils/index.js` does not currently export `log`
- Frontend build is blocked by the current `react-scripts` dependency state
- Client upload requests send hard-coded basic-auth credentials, but backend basic-auth middleware is commented out in `server.js`
- JWT handling decodes tokens but does not verify them
- `web.train/web/src/defines.js` hardcodes a production IP address
- There are many leftover `console.log` calls across both apps
- There is no meaningful top-level project documentation besides placeholder READMEs
- No automated test suite was found in active use

## Working Rules For Agents

- Check `git status --short` before editing; this repo may already be dirty
- Do not assume files under `web.train/web/src` are all active routes; confirm from `src/index.js` first
- When adding protected backend endpoints, use validators or replicate their audit/auth behavior intentionally
- When changing upload behavior, inspect both backend file handling and frontend `FileUploadCustom.jsx`
- Prefer small, targeted fixes; several modules look legacy and loosely maintained
- Verify backend changes with `npm run build` in `web.train/api`
- Verify frontend changes with `npm run build` in `web.train/web`, but expect dependency issues until `react-scripts` is corrected

## Suggested Starting Points

For backend work:

- start at `web.train/api/src/server.js`
- then inspect the matching route/controller/service/model chain

For frontend work:

- start at `web.train/web/src/index.js`
- then inspect `web.train/web/src/pages/Home.jsx`
- follow requests through `web.train/web/src/providers/api.js`

