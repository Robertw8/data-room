# Cyan Data Room

Cyan Data Room is a full-stack virtual Data Room for organizing and securely sharing due-diligence documents. Owners can arrange PDFs in nested folders and share an entire Data Room, a folder subtree, or one file through read-only public or user-specific access.

## Contents

- [Live demo](#live-demo) · [Quick demo](#quick-demo) · [Features](#features) · [Tech stack](#tech-stack)
- [Architecture](#architecture) · [File upload flow](#file-upload-flow) · [Sharing and access control](#sharing-and-access-control) · [Data model and ERD](#data-model-and-erd)
- [Key design decisions](#key-design-decisions) · [How it scales](#how-it-scales) · [Consistency and failure handling](#consistency-and-failure-handling) · [Known limitations](#known-limitations)
- [Local setup](#local-setup) · [Verification](#verification) · [AI usage](#ai-usage) · [Repository structure](#repository-structure)

## Live demo

- Frontend: [https://data-room-cyan.vercel.app](https://data-room-cyan.vercel.app)
- API base URL: [https://data-room-production-6d31.up.railway.app](https://data-room-production-6d31.up.railway.app)

The React frontend is deployed on Vercel. The NestJS API and PostgreSQL database are hosted on Railway, while PDF objects are stored in private AWS S3 and accessed through short-lived presigned URLs.

## Quick demo

| Role   | Email                   | Password       |
| ------ | ----------------------- | -------------- |
| Owner  | `demo-owner@email.com`  | `CyanDemo2026` |
| Viewer | `demo-viewer@email.com` | `CyanDemo2026` |

Suggested reviewer path:

1. Sign in as **Owner**, open an existing Data Room, and inspect nested folders and PDFs.
2. Upload and view a PDF, then try its rename and move actions.
3. Open **Shared by me** to inspect public and user-specific shares.
4. Sign in as **Viewer**, open **Shared with me**, and browse a USER share in read-only mode.
5. Open the prepared **Public demo** link below while logged out or in a private browser window to verify anonymous read-only access.

### Public demo

A prepared read-only Folder share can be opened without signing in:

[Open public share](https://data-room-cyan.vercel.app/shared/public/9c6a63dc-fdb7-4466-95a3-334f7358238f)

## Features

### Authentication

- Registration and email/password login
- bcrypt password hashing and one-hour JWT Bearer access tokens
- Session restoration through the stored token and `GET /auth/me`
- Logout that clears the local access token and user state

### Data Rooms

- Create, list, open, rename, and delete owner-scoped Data Rooms
- One Data Room name per owner, enforced in the service and database
- Deletion preview with descendant folder count, file count, and total file size

### Folders

- Arbitrarily nested adjacency-list hierarchy with breadcrumbs
- Create and rename folders
- Recursive folder deletion, including descendant objects in S3
- Unique sibling names within each logical directory, including the Data Room root
- Deletion preview with subtree folder count, file count, and total file size

### Files

- PDF-only uploads up to 50 MB
- Multi-file drag-and-drop with independent progress and errors per file
- Retry for an individual failed upload
- In-app PDF viewer with an option to open the file in a new tab
- Rename, move between folders or the Data Room root, and delete
- Unique sibling filenames within each logical directory

### Sharing

- Shares targeting one Data Room, Folder, or File
- PUBLIC links and shares assigned to a specific existing USER
- Read-only navigation within the exact shared scope, including nested folder content
- Owner-controlled revocation
- **Shared by me** and **Shared with me** views
- Recovery states when owner resources disappear or shared access is deleted or revoked

Search, document versioning, editable shares, comments, and real-time updates are not implemented.

## Tech stack

| Area           | Current implementation                                                                   |
| -------------- | ---------------------------------------------------------------------------------------- |
| Frontend       | React 19, TypeScript, Vite, React Router, TanStack Query, Axios, Tailwind CSS, shadcn/ui |
| Backend        | NestJS 11, TypeScript, Prisma 7                                                          |
| Database       | PostgreSQL                                                                               |
| Storage        | Private AWS S3, AWS SDK v3, presigned URLs                                               |
| Authentication | JWT Bearer tokens, bcrypt                                                                |
| Hosting        | Vercel frontend, Railway API/database, AWS S3 objects                                    |

## Architecture

```mermaid
flowchart LR
    Browser["Browser / React SPA"]
    API["NestJS API"]
    DB[(PostgreSQL)]
    S3[(Private AWS S3)]

    Browser -->|"JWT-authenticated JSON requests"| API
    API -->|"Prisma queries"| DB
    API -->|"Sign URLs, HEAD, delete"| S3
    Browser -->|"Presigned PUT: PDF bytes"| S3
    S3 -->|"Presigned GET: PDF bytes"| Browser
```

The browser uses the API for identity, authorization, metadata, hierarchy, and share resolution. The API is the security boundary: it derives the user from a verified JWT, scopes owner queries to that user, and resolves shared reads against an active token before issuing a view URL.

PDF bytes do not pass through NestJS during upload or viewing. After authorization, the browser transfers bytes directly to or from S3 with short-lived presigned URLs; PostgreSQL stores the logical file metadata and immutable object key.

See [Detailed architecture](./docs/architecture.md) for module responsibilities, failure modes, and scaling trade-offs.

## File upload flow

```mermaid
sequenceDiagram
    participant Browser
    participant API as NestJS API
    participant S3 as AWS S3
    participant DB as PostgreSQL

    Browser->>API: POST /files/upload-url with Bearer token
    API->>DB: Verify owner, Data Room, and optional folder
    API-->>Browser: Unique storageKey and presigned PUT URL
    Browser->>S3: PUT PDF using presigned URL
    S3-->>Browser: Upload result
    Browser->>API: POST /files/complete with Bearer token
    API->>DB: Recheck owner and logical destination
    API->>S3: HEAD object
    S3-->>API: Content-Type and Content-Length
    API->>DB: Insert validated File metadata
    DB-->>API: File record
    API-->>Browser: Completed file
```

The API authorizes the destination and returns a five-minute presigned PUT for a generated key. The browser uploads with plain Axios, so the application Bearer token is never sent to S3. Completion rechecks access and uses S3 `HEAD` to verify a non-empty PDF no larger than 50 MB before persisting metadata. The immutable `storageKey` is independent of the display name, so logical rename and move operations remain database-only. [Architecture details](./docs/architecture.md#upload-sequence)

## Sharing and access control

Each `Share` records a unique token, `PUBLIC` or `USER` type, role, creator, optional recipient, revocation state, and exactly one Data Room, Folder, or File target. The service validates that target and a PostgreSQL `CHECK` constraint enforces it for every write. The schema includes `VIEWER` and `EDITOR`, but the current service creates only read-only `VIEWER` shares.

- **PUBLIC:** anyone holding the active token can use the unguarded `/public/shares/:token` read paths.
- **USER:** the guarded `/shares/:token` read paths require both a valid JWT and a token assigned to that authenticated recipient.
- **Data Room target:** grants read access to the whole room hierarchy.
- **Folder target:** grants access to that folder and its descendants, not its ancestors or siblings.
- **File target:** grants access only to that file.
- **Revocation:** the creator can set `revokedAt`; active-share queries and resolution require it to be `null`.

Owner CRUD remains owner-only. Shared screens hide mutations, while separate backend read paths enforce token type, recipient where applicable, revocation state, and target scope. `EDITOR` is an extension point, not an implemented permission. [Sharing details](./docs/architecture.md#sharing-model)

## Data model and ERD

```mermaid
erDiagram
    USER ||--o{ DATA_ROOM : owns
    USER ||--o{ SHARE : creates
    USER o|--o{ SHARE : receives
    DATA_ROOM ||--o{ FOLDER : contains
    DATA_ROOM ||--o{ FILE : contains
    FOLDER o|--o{ FOLDER : parent_of
    FOLDER o|--o{ FILE : contains
    DATA_ROOM o|--o{ SHARE : targeted_by
    FOLDER o|--o{ SHARE : targeted_by
    FILE o|--o{ SHARE : targeted_by

    USER {
        string id PK
        string email UK
        string passwordHash
    }
    DATA_ROOM {
        string id PK
        string ownerId FK
        string name
    }
    FOLDER {
        string id PK
        string dataRoomId FK
        string parentId FK "nullable"
        string name
    }
    FILE {
        string id PK
        string dataRoomId FK
        string folderId FK "nullable"
        string name
        string storageKey UK
        string mimeType
        int size
    }
    SHARE {
        string id PK
        string token UK
        string type
        string role
        string createdById FK
        string recipientUserId FK "nullable"
        string dataRoomId FK "nullable"
        string folderId FK "nullable"
        string fileId FK "nullable"
        datetime revokedAt "nullable"
    }
```

Important database invariants:

- `(ownerId, name)` is unique for Data Rooms.
- Folder and file names are unique among siblings. Separate partial indexes cover nested and root rows because their parent/folder IDs are nullable.
- `storageKey` is globally unique and remains independent of the user-visible filename.
- A Share has exactly one non-null Data Room, Folder, or File target.

Friendly service checks are backed by database constraints for concurrency races and writes outside the normal service path. [Invariant details](./docs/architecture.md#database-invariants)

## Key design decisions

- **Direct S3 transfer:** NestJS authorizes and signs; the browser transfers bytes without proxying them through the API.
- **Immutable storage keys:** rename and move update logical metadata without copying S3 objects.
- **Adjacency-list folders:** `parentId` keeps child listing simple, with ancestor/subtree work proportional to hierarchy depth and subtree size.
- **Separate owner/shared paths:** backend controllers, not read-only UI state, enforce the security boundary.
- **Database-backed uniqueness:** service pre-checks provide useful messages; unique indexes stop races and `P2002` maps to `409`.
- **S3-first deletion:** storage is deleted before metadata. S3 and PostgreSQL are not atomic, so production recovery still needs reconciliation.

The implementation rationale and failure cases are expanded in [Detailed architecture](./docs/architecture.md).

## How it scales

### Total size and item count of a folder subtree

The current folder deletion-stat endpoint traverses the subtree level by level and aggregates file count and size for the collected folder IDs; Data Room statistics aggregate directly by `dataRoomId`. This is suitable for occasional previews but scales with subtree size and depth. Frequent larger-scale reads could use denormalized `totalSize`/`itemCount` maintained transactionally or asynchronously with reconciliation. Those counters do not exist today.

### One Data Room with 100,000 files

Current navigation is directory-based and uses indexed Data Room plus parent/folder columns, but it loads the whole current directory. At 100,000 files, bounded cursor/keyset pagination, matching composite indexes, and lazy navigation would be required; a future search feature would need an indexed database/search strategy rather than room-wide scanning. Pagination and search are not implemented.

### Viewer/editor roles without remodeling

`ShareRole` already contains `VIEWER` and `EDITOR`, so the Share table would not need remodeling. An editor extension would require shared write paths to validate both target scope and `EDITOR`, while share management could remain owner-only. Today all created shares are `VIEWER` and no shared mutation routes exist.

## Consistency and failure handling

- DTOs use class-validator. A global `ValidationPipe` transforms inputs and rejects non-whitelisted fields rather than silently accepting them; malformed DTOs return Nest's `400` responses.
- Missing or invalid Bearer credentials return `401`.
- Missing, foreign, out-of-scope, or revoked resources generally return `404` to avoid exposing their existence.
- Duplicate names and completed-upload conflicts return `409`.
- S3 deletion failures stop the subsequent database deletion in the current flow.
- The frontend provides loading, empty, request-error, upload-retry, and deleted/revoked-resource recovery states. Destructive operations use application dialogs and disable repeat submission while pending.

The API uses Nest's standard exception responses; it does not define a custom uniform error envelope.

## Known limitations

1. **S3 and PostgreSQL are not atomic.** S3 deletion may succeed and the database deletion may then fail, leaving metadata that points to a missing object. A production design should add durable reconciliation or a transactional outbox/state-machine workflow.
2. **Incomplete uploads can leave orphan objects.** The browser PUT may succeed while `/files/complete` is never called or fails. Upload-session records with a `PENDING` state, lifecycle expiration, and background cleanup would address this.
3. **Already issued view URLs survive revocation briefly.** Presigned GET URLs expire after five minutes, but revoking the Share cannot invalidate a URL already issued by S3.
4. **Authentication has no refresh-token or rotation system.** Access tokens expire after one hour and are stored in browser local storage.
5. **Directory responses are unpaginated.** A single directory with 100,000 children is outside the current listing design.
6. **USER shares require an existing registered recipient.** The service resolves the supplied email immediately and does not implement invitations.
7. **Automated coverage is intentionally small.**
   The backend test suite provides focused coverage for health checks,
   authentication guards, Share target validation, and upload validation.
   Broader owner, sharing, and S3 workflows would need additional integration
   and end-to-end coverage for production hardening.

## Local setup

### Prerequisites

- Node.js and npm compatible with the checked-in package lockfiles
- PostgreSQL
- An AWS account with a private S3 bucket and credentials permitted to put, head, get, and delete objects

The S3 bucket must allow the frontend origin to perform the direct presigned PUT with the `Content-Type` header. Configure bucket CORS for the exact local/deployed origins and only the methods and headers needed by the browser upload/view flow; keep direct public object access disabled.

### Backend

```bash
cd server
npm install
cp .env.example .env
```

Set all backend variables:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=<strong secret>
AWS_REGION=<bucket region>
AWS_S3_BUCKET=<private bucket name>
AWS_ACCESS_KEY_ID=<AWS access key>
AWS_SECRET_ACCESS_KEY=<AWS secret key>
```

Generate the Prisma client, apply the checked-in migrations, and start the API:

```bash
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

The server listens on `PORT` when the hosting environment provides it and otherwise uses `3000`. Local frontend CORS is configured for `http://localhost:5173`.

### Frontend

In a second terminal:

```bash
cd client
npm install
cp .env.example .env
```

Set the API base URL:

```dotenv
VITE_API_URL=http://localhost:3000
```

Then start Vite:

```bash
npm run dev
```

## Verification

`GET /health` returns the API status and an ISO timestamp for deployment checks.

The repository exposes these quality gates:

```bash
# Backend
cd server
npm test          # current scope: 4 suites / 6 tests
npm run lint
npm run build

# Frontend
cd ../client
npm run lint
npm run build

# Repository root
cd ..
git diff --check
```

The small Jest suite is a smoke-level safety net, not a claim of comprehensive coverage.

Manual end-to-end verification was performed against the deployed application,
covering owner flows, PUBLIC and USER sharing, direct S3 upload/view/delete,
share revocation, and recursive folder/Data Room deletion.

## AI usage

AI tools were used as reviewed development aids, not as an autonomous source of requirements or correctness.

| Tool    | Where it was used                                                                                                                                                                                       | Review and verification                                                                                                                                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ChatGPT | Architecture discussion, requirements analysis, debugging/mentoring, edge-case analysis, design alternatives, and documentation planning                                                                | The developer decided the final architecture and scope, checked suggestions against the assignment and repository, and accepted or rejected them explicitly.                                                                      |
| Codex   | Repository-wide and mechanical implementation, repetitive frontend/backend integration, focused audits, validation and error-handling cleanup, consistency checks, and running build/lint/test commands | Changes were inspected in diff form and checked against existing patterns. The developer retained responsibility for important flows, S3 upload orchestration, manual testing, final UX/security decisions, and the final review. |

Concrete review examples include fixing a `ValidationPipe` ordering issue instead of accepting misleading runtime behavior; removing meaningless autogenerated Nest `toBeDefined()` scaffold suites rather than manufacturing dependency mocks merely to make the suite green; rejecting optional search, versioning, SSE, and heavyweight PDF rendering to preserve the requested scope; and hardening Data Room, folder, and file name uniqueness with both friendly service checks and database constraints after analyzing concurrency races.

AI did not independently choose the product scope, and the code is not represented as entirely handwritten. Suggestions were treated as proposals: the developer remains accountable for understanding the implementation, manually checking critical flows, and deciding which generated changes belong in the final submission.

## Repository structure

```text
.
├── client/             # React/Vite application
├── server/             # NestJS API
│   ├── prisma/         # Prisma schema and PostgreSQL migrations
│   └── src/            # Controllers, services, modules, DTOs
├── docs/
│   └── architecture.md # Detailed technical design
├── README.md
└── AGENTS.md           # Repository contribution instructions
```
