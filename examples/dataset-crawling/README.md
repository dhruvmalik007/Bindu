### Bindu Agent Dashboard

This example includes a **Bindu Agent Dashboard** located in the `dashboard/` directory. This full-stack application allows you to:

1.  **Configure Agents**: A No-Code interface to create crawling agents with specific targets and instructions.
2.  **Orchestrate**: A central system that manages these agents.
3.  **Chat**: interact with your agent cluster via a chat interface.

#### Structure
-   `dashboard/backend`: FastAPI server for agent management.
-   `dashboard/frontend`: Next.js application for the UI.

#### Running the Application

We provide a helper script to setup and run both the backend and frontend simultaneously.

**Prerequisites:**
-   Python 3.10+
-   Node.js & npm

**Command:**
```bash
chmod +x setup_and_run.sh
./setup_and_run.sh
```

This will:
1.  Install backend dependencies.
2.  Install frontend dependencies.
3.  Start the FastAPI backend on `http://localhost:8000`.
4.  Start the Next.js frontend on `http://localhost:3000`.

Open `http://localhost:3000` to access the dashboard.