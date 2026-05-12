# Nexus Chat — Real-Time Chat Application

A full-stack real-time chat application built with Next.js, Strapi, and Socket.io.

---

## Project Structure

```
chat-app/
├── frontend/          # Next.js application
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── login/page.tsx
│       │   ├── register/page.tsx
│       │   └── chat/
│       │       ├── page.tsx
│       │       └── chat.module.css
│       ├── components/
│       │   ├── ChatMessage.tsx
│       │   ├── ChatMessage.module.css
│       │   ├── UserList.tsx
│       │   ├── UserList.module.css
│       │   ├── RoomSelector.tsx
│       │   └── RoomSelector.module.css
│       ├── lib/
│       │   ├── api.ts
│       │   └── socket.ts
│       └── styles/
│           └── globals.css
└── backend/           # Strapi application
    ├── config/
    │   ├── server.js
    │   ├── database.js
    │   ├── admin.js
    │   ├── middlewares.js
    │   └── plugins.js
    └── src/
        ├── index.js
        └── api/
            └── message/
                ├── content-types/message/schema.json
                ├── controllers/message.js
                ├── routes/message.js
                └── services/message.js
```

---

## Setup & Installation

### Backend (Strapi)

```bash
cd backend
cp .env.example .env
npm install
npm run develop
```

After first run, open `http://localhost:1337/admin` and create an admin account.

Then go to **Settings → Users & Permissions → Roles → Authenticated** and enable:
- `message.find`
- `message.findOne`
- `message.create`

### Frontend (Next.js)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`

---

## File-by-File Description

---

### FRONTEND

---

#### `frontend/package.json`
Defines all frontend dependencies. Key packages:
- **next** — The React framework that handles routing, SSR, and the build pipeline.
- **socket.io-client** — Client-side Socket.io library for establishing real-time WebSocket connections with the backend.
- **axios** — Promise-based HTTP client used to make REST API calls to Strapi (login, register, fetch messages).
- **js-cookie** — Used to read and write browser cookies, which is how the JWT token and user data are persisted across page reloads.

---

#### `frontend/next.config.js`
Next.js configuration file. It exposes two environment variables to the browser at build time:
- `NEXT_PUBLIC_BACKEND_URL` — The base URL for all Strapi REST API calls.
- `NEXT_PUBLIC_SOCKET_URL` — The URL the Socket.io client connects to (same as backend in this setup).

Using `NEXT_PUBLIC_` prefix makes them accessible in both server and client components.

---

#### `frontend/src/styles/globals.css`
The single global stylesheet that defines the entire visual design system using CSS custom properties (variables). It imports two Google Fonts — **Syne** (used for headings and branding, giving a geometric/editorial feel) and **DM Sans** (body text, highly legible at small sizes). All colors, spacing, border-radius values, and shadows are defined as variables here so changing one value cascades consistently through the whole application. It also defines reusable utility classes like `.page-wrapper`, `.card`, `.form-input`, `.btn-primary`, and `.error-msg` that are shared between the login and register pages.

---

#### `frontend/src/app/layout.tsx`
The root layout that wraps every page in the Next.js App Router. It imports the global CSS file (this is the only place global CSS can be imported in the App Router) and sets the HTML metadata like the page title and description. All pages are rendered inside this shell.

---

#### `frontend/src/app/page.tsx`
The root route `/`. It runs a client-side redirect on mount — if a JWT token exists in cookies the user is sent to `/chat`, otherwise to `/login`. This prevents authenticated users from seeing the login screen again on visiting the home URL.

---

#### `frontend/src/app/login/page.tsx`
The login page with a controlled form for username/email and password. On submit it calls `POST /api/auth/local` (Strapi's built-in local auth endpoint). On success, the JWT and a serialized user object are saved to cookies (7-day expiry) and the user is redirected to `/chat`. On failure, the error message from Strapi's response is extracted and shown to the user. Uses the shared card/form styles from `globals.css`.

---

#### `frontend/src/app/register/page.tsx`
The registration page. It collects username, email, password, and a confirm-password field. Client-side validation checks that all fields are filled, passwords match, and the password meets a minimum length of 6 characters before making the API call. It calls `POST /api/auth/local/register`. On success, exactly like login, it saves the JWT to cookies and redirects to `/chat`.

---

#### `frontend/src/app/chat/page.tsx`
The main chat interface and the most complex file in the project. Here is what it manages:

1. **Auth guard** — On mount it reads the cookie. If no token is found, it redirects to `/login`.
2. **Socket connection** — Calls `getSocket(token)` to create (or reuse) a Socket.io connection, then registers all event listeners:
   - `connect` / `disconnect` — Tracks the connection status shown as a colored dot in the sidebar.
   - `room-messages` — Receives the history of the room the user just joined and sets the messages state.
   - `new-message` — Receives a single new message broadcast by the server and appends it to the messages list.
   - `active-users` — Receives the updated list of users in the room whenever someone joins or leaves.
3. **Room switching** — Emits a `leave-room` event to the old room, clears messages, fetches history for the new room via REST API (for cases where the socket hasn't delivered history yet), then emits `join-room` to the new room.
4. **Sending a message** — Calls `POST /api/messages` on Strapi. The controller then fires the `new-message` socket event server-side, which broadcasts to all clients in that room (including the sender).
5. **Auto-scroll** — A `useRef` attached to a dummy div at the bottom of the message list is scrolled into view every time the messages array changes.
6. **Logout** — Emits `leave-room`, calls `disconnectSocket()`, removes cookies, and redirects to `/login`.

---

#### `frontend/src/app/chat/chat.module.css`
Scoped CSS module for the chat page layout. Defines a two-column flex layout — a fixed-width sidebar (260px) and a flex-growing main area. The main area is itself a flex column with a header, a scrollable messages area, and a pinned input bar at the bottom. Includes a responsive breakpoint at 768px where the sidebar transforms into a slide-in drawer that overlays the content, triggered by a hamburger button.

---

#### `frontend/src/components/ChatMessage.tsx`
A presentational component that renders a single chat message bubble. It accepts three props: the message object, a boolean `isOwn` (whether the message was sent by the logged-in user), and `showAvatar` (whether this is the first message in a consecutive block from the same user, to avoid repeating avatars). Own messages appear on the right in accent purple; others appear on the left with a gray bubble. Each username is assigned a consistent color using a deterministic hash function so the same user always has the same color across all sessions.

---

#### `frontend/src/components/UserList.tsx`
Renders the list of currently online users in the sidebar. It deduplicates by `userId` (a user could theoretically have two browser tabs open) before rendering. Each user gets a colored avatar with a green online dot badge. The current user is labeled with "(you)" and rendered slightly brighter. It uses the same color-hashing function as `ChatMessage` for visual consistency.

---

#### `frontend/src/components/RoomSelector.tsx`
A simple list of channel buttons in the sidebar. The active room is highlighted with the accent background color. Clicking a room calls the `onSelect` callback passed in from the parent chat page, which handles the full room-switch logic. The design mimics a Discord-style channel list with a `#` prefix.

---

#### `frontend/src/lib/api.ts`
Creates and exports a pre-configured Axios instance. It has two interceptors:
1. **Request interceptor** — Reads the JWT from cookies and attaches it as an `Authorization: Bearer <token>` header on every outgoing request automatically. This means no page has to manually handle auth headers.
2. **Response interceptor** — If any response comes back with a 401 Unauthorized status, it automatically clears the auth cookies and redirects the browser to `/login`. This handles token expiry gracefully.

---

#### `frontend/src/lib/socket.ts`
Manages the Socket.io client as a module-level singleton. The `getSocket(token)` function creates a new connection only if one doesn't already exist or if the existing one has been disconnected. This prevents duplicate connections when React re-renders or when the effect runs multiple times. The `disconnectSocket()` function is called on logout to cleanly close the WebSocket and null out the singleton so the next login gets a fresh connection.

---

### BACKEND

---

#### `backend/package.json`
Defines all Strapi backend dependencies:
- **@strapi/strapi** — The core Strapi framework.
- **@strapi/plugin-users-permissions** — Provides JWT-based user authentication (register, login, role-based access).
- **better-sqlite3** — The SQLite database driver used in development. Can be replaced with PostgreSQL for production.
- **socket.io** — Server-side Socket.io for real-time WebSocket communication.
- **jsonwebtoken** — Used to verify JWTs inside the Socket.io middleware.

---

#### `backend/config/server.js`
Configures the HTTP server's host and port. The `app.keys` array is used by Strapi internally for session encryption. In production these should be long random strings set via environment variables.

---

#### `backend/config/database.js`
Configures Strapi's database connection. In development it uses SQLite with a file stored at `.tmp/data.db` — no database server installation required. For production, swap `client: "sqlite"` for `client: "postgres"` and provide a connection string.

---

#### `backend/config/admin.js`
Holds secrets used by the Strapi admin panel. `auth.secret` signs admin session tokens, `apiToken.salt` generates API keys, and `transfer.token.salt` is used for Strapi's data transfer feature. All should be set via environment variables in production.

---

#### `backend/config/middlewares.js`
Registers Strapi's middleware stack in order. The important one here is the `strapi::cors` middleware which is configured to allow requests only from `http://localhost:3000` (the Next.js dev server). This prevents cross-origin issues between the frontend and backend during development.

---

#### `backend/config/plugins.js`
Configures the `users-permissions` plugin. Sets the JWT expiry to 7 days (matching the cookie lifetime set in the frontend) and specifies the `jwtSecret` used to sign authentication tokens. This secret must match what the Socket.io middleware in `src/index.js` uses to verify tokens.

---

#### `backend/src/api/message/content-types/message/schema.json`
Defines the **Message** content type in Strapi — this is what creates the database table. Fields:
- `text` (text, required, max 500 chars) — The message content.
- `room` (string, required) — The name of the chat room.
- `username` (string, required) — The sender's username, stored denormalized for fast retrieval.
- `author` (relation, many-to-one → user) — A foreign key linking the message to the Strapi user who created it. `draftAndPublish` is set to `false` because messages are always live; there is no draft state.

---

#### `backend/src/api/message/controllers/message.js`
Extends Strapi's auto-generated CRUD controller for the Message type. The `find` method is kept as the default. The `create` method is overridden to:
1. Extract the authenticated user's ID from `ctx.state.user` (Strapi populates this after verifying the JWT).
2. Validate that `text`, `room`, and `username` were provided.
3. Trim and truncate the text to 500 characters.
4. Save the message to the database via `strapi.entityService.create`.
5. After saving, access the shared `strapi.io` Socket.io instance (attached during bootstrap) and emit a `new-message` event to all clients in that room. This is the bridge between the REST API and the real-time layer.

---

#### `backend/src/api/message/routes/message.js`
Defines which HTTP routes are enabled and which require authentication. `find`, `findOne`, and `create` require a valid JWT (authenticated users only). `update` and `delete` are left disabled by returning `auth: false` without enabling them in the Strapi admin, effectively blocking those operations in this app.

---

#### `backend/src/api/message/services/message.js`
Extends the default Strapi service with a custom method `getMessagesByRoom(room, limit)`. This method queries messages filtered by room, sorted by creation time ascending, and maps them into a clean flat object structure. It is called by the Socket.io `join-room` handler in `src/index.js` to send chat history to a user when they enter a room.

---

#### `backend/src/index.js`
The most important backend file. It hooks into Strapi's `bootstrap` lifecycle (runs once after Strapi starts). Here it:

1. **Creates the Socket.io server** — Attaches it to Strapi's existing HTTP server so both REST API and WebSockets share the same port (1337). Configures CORS to allow only the frontend origin.

2. **Attaches `io` to `strapi`** — `strapi.io = io` makes the Socket.io instance globally accessible. The message controller in `controllers/message.js` reads it via `strapi.io` to emit events after saving messages.

3. **JWT Middleware** — Every new socket connection must provide a valid JWT in `socket.handshake.auth.token`. The middleware verifies it using `jsonwebtoken` with the same secret configured in `plugins.js`. Invalid or missing tokens are rejected before the connection is established, securing the WebSocket layer just like the REST API.

4. **`join-room` event** — When the client emits this, the socket joins the Socket.io room (a named broadcast group), the user is added to the in-memory `roomUsers` map, all clients in the room get an updated user list, and the joining client receives the last 50 messages from the database.

5. **`leave-room` event** — Removes the user from the room's user list and broadcasts the updated list.

6. **`disconnect` event** — Fires automatically when a client drops (tab closed, network lost). Cleans up the user from all rooms they were in and broadcasts updated user lists.

The `roomUsers` object is an in-memory map (`{ roomName: [{ socketId, username, userId }] }`) that tracks who is currently online in each room. It is reset if the server restarts, which is acceptable for presence data.

---

## Architecture Overview

```
Browser (Next.js)
│
├── REST (Axios)  ──────────────────────▶  Strapi API (/api/*)
│   • Login / Register                     • Validates JWT
│   • Fetch message history                • Saves to SQLite
│   • POST new message ──────────────────▶ Controller emits socket event
│
└── WebSocket (Socket.io-client)  ───────▶  Socket.io Server (src/index.js)
    • join-room / leave-room               • JWT middleware (verify on connect)
    • Receives: new-message                • Broadcasts to room
    • Receives: active-users               • Tracks room membership in memory
    • Receives: room-messages              • Fetches DB history on join
```

The REST API handles persistence (write to DB, fetch history). The WebSocket layer handles everything real-time (push new messages, sync user presence). They are connected at the controller level — when a message is saved via REST, the controller fires a socket event.

---

## Design Decisions

- **SQLite in development** — Zero configuration, no database server needed. The schema is identical to PostgreSQL so switching for production requires only changing the `config/database.js` file.
- **Module-level socket singleton** — Prevents duplicate WebSocket connections on React re-renders or StrictMode double-invocations.
- **Denormalized `username` on messages** — Storing the username directly on the message row avoids an extra JOIN on every message fetch and keeps the socket payload simple.
- **In-memory room presence** — User presence (who is online) is tracked in a plain JavaScript object on the server. It is fast, simple, and appropriate for a single-server deployment. For multi-server scaling, this would move to Redis pub/sub.
- **JWT verification on socket connect** — The same token used for REST API calls is reused for WebSocket authentication. This avoids a separate auth mechanism and keeps the security model simple and consistent.
# chat_app
# chat_app
