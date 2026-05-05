# TaskFlow – Team Task Manager

A full-stack web application for managing projects and tasks with role-based access control (Admin/Member).

**Live Demo:** [your-frontend.vercel.app](https://your-frontend.vercel.app)  
**Backend API:** [your-backend.railway.app](https://your-backend.railway.app)

---

## Features

- **Authentication** – Signup/Login with JWT, protected routes
- **Projects** – Create, view, and delete projects; users are scoped to only their projects
- **Role-Based Access Control** – Project creators become Admins; Admins can manage tasks and members; Members can update status of assigned tasks
- **Task Management** – Create, assign, update, delete tasks with status (Todo / In Progress / Done) and priority (Low / Medium / High)
- **Team Management** – Add members by email search, remove members, view team
- **Dashboard** – Stats: total projects, tasks, tasks assigned to me, overdue count; recent tasks; overdue list
- **Kanban Board** – Tasks displayed in 3 status columns per project
- **Filters** – Filter tasks by status and priority

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, React Router DOM v6, Tailwind CSS |
| Backend | Node.js, Express.js |
| Validation | Zod (schema-based request validation) |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Deployment | Railway (backend + DB), Vercel (frontend) |

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── models/         # User, Project, Task schemas
│   ├── routes/         # auth, projects, tasks, users
│   ├── middleware/     # JWT auth, project access (member/admin)
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/ # Layout, TaskCard, TaskModal, AddMemberModal
    │   ├── context/    # AuthContext (JWT + user state)
    │   ├── pages/      # Login, Signup, Dashboard, Projects, ProjectDetail
    │   └── utils/      # Axios instance with auth interceptor
    └── .env.example
```

---

## Local Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm run dev            # runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5000/api
npm run dev            # runs on http://localhost:5173
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get logged-in user |

### Projects
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/projects` | Member |
| POST | `/api/projects` | Authenticated |
| GET | `/api/projects/:id` | Member |
| PUT | `/api/projects/:id` | Admin |
| DELETE | `/api/projects/:id` | Admin |
| POST | `/api/projects/:id/members` | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Admin |

### Tasks
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/projects/:id/tasks` | Member |
| POST | `/api/projects/:id/tasks` | Admin |
| PUT | `/api/projects/:id/tasks/:taskId` | Admin (all fields) / Member (status only) |
| DELETE | `/api/projects/:id/tasks/:taskId` | Admin |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Aggregated stats for logged-in user |

---

## Deployment

### Step 1 — Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) → Login with GitHub
2. New Project → Deploy from GitHub → select your repo
3. Set **Root Directory** → `backend`
4. Add environment variables:
   - `MONGO_URI` – MongoDB Atlas connection string
   - `JWT_SECRET` – any random secret
   - `FRONTEND_URL` – your frontend Railway URL (update after Step 2)
5. Railway auto-detects `npm start` — copy your backend URL once deployed

### Step 2 — Deploy Frontend on Railway

1. In the same Railway project → **New Service** → GitHub repo
2. Set **Root Directory** → `frontend`
3. Set **Build Command** → `npm run build`
4. Set **Start Command** → `npx serve -s dist -l 3000`
5. Add environment variables:
   - `VITE_API_URL` – your Railway backend URL + `/api`
   - `PORT` – `3000`
6. Deploy — copy your frontend URL

### Step 3 — Update Backend CORS

Go back to backend service on Railway → update:
- `FRONTEND_URL` – your frontend Railway URL from Step 2

Railway will redeploy automatically. Both services are now live and connected.

---

## Environment Variables

### Backend `.env`
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
PORT=5000
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend `.env`
```
VITE_API_URL=https://your-backend.railway.app/api
```

---

## Author

**Keshav Kaushik**  
[GitHub](https://github.com/KeshavKaushik13) · [LinkedIn](https://linkedin.com/in/yourprofile)
