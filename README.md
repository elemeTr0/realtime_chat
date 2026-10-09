# HOP APP 💬

HOP APP is a web-based messaging application built to provide a simple and intuitive chatting experience. The project is currently under development.

## 🚀 Tech Stack

**Frontend**

* React
* TypeScript
* Vite
* CSS

**Backend & Database**

* Supabase Authentication
* PostgreSQL
* Supabase Row Level Security (RLS)

**Additional Technologies**

* React Router
* Node.js
* Express.js (starter backend)

## ✨ Current Features

* User registration and login
* Authentication using Supabase
* Protected home route
* User profiles
* Conversations and messaging
* Database access protected by Row Level Security

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd HOPapp
```

### 2. Install frontend dependencies

```bash
cd frontend/hop_chat
npm install
```

### 3. Configure environment variables

Create a `.env` file inside `frontend/hop_chat`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Use your own Supabase project credentials. Never put secret keys or private credentials in frontend environment variables.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL shown in your terminal.

## 🗺️ Project Status

HOP APP is actively being developed. More features and improvements will be added over time.

## 📄 License

No license has been specified yet.
