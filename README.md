# The Engineer's Log: Sales Insight Automator

## Project Overview

Sales Insight Automator is a secure, containerized web application that allows users to upload a CSV or XLSX sales data file, enter a recipient email address, and receive an AI-generated executive summary of the data via email. It leverages the Google Gemini API for powerful, dynamic data summarization.

## Architecture Diagram

```mermaid
graph TD;
    Client[React Frontend] -->|POST /upload (CSV/XLSX + Email)| Backend[Node.js Backend];
    Backend -->|Parse Data| XLSX[XLSX Parser];
    XLSX -->|Generate Summary| Gemini[Google Gemini API];
    Gemini -->|AI Summary| Backend;
    Backend -->|Send Email| EmailService[SendGrid / Nodemailer];
    EmailService -->|Delivers to| UserEmail[User Inbox];
```

## 1. A brief overview of how you secured the endpoints

To ensure the application is robust and secured against common vulnerabilities and resource abuse:
- **File Type Validation**: The backend strictly validates and allows only `.csv` or `.xlsx` files, rejecting malicious payloads or unexpected file types immediately.
- **Payload Size Restriction**: To prevent memory exhaustion and DoS attacks (Denial of Service), the API enforces a strict file size limit of 5MB per upload.
- **API Secret Management**: External API keys (`GEMINI_API_KEY`, etc.) are secured and managed through environment variables locally or in production securely. These tokens are absolutely decoupled from the client, meaning no secrets are exposed to the browser.
- **CORS Policies**: Explicit Cross-Origin Resource Sharing rules are integrated. While permissive locally (`*` for easiest onboarding), production configuration securely constraints origins primarily to the trusted frontend domains (e.g., `https://your-vercel-frontend-domain.com`).
- **Error Handling**: Exceptions are caught natively and logged server-side, preventing raw stack traces or internal environment variables from leaking out into client JSON responses.

## 2. Environment Configuration (`.env.example`)

Copy the `.env.example` file to `.env` in the root directory and update it with your actual credentials.

```bash
cp .env.example .env
```

| Variable | Description |
| -------- | ----------- |
| `GEMINI_API_KEY` | Google Gemini API Key |
| `SENDGRID_API_KEY` | (Optional) Sendgrid API key for emails |
| `SMTP_HOST` | SMTP server host (e.g. `smtp.gmail.com`) |
| `SMTP_USER` | Email username |
| `SMTP_PASS` | SMTP app password |
| `FROM_EMAIL` | Sender email identity |

## 3. Clear steps to run the stack via `docker-compose`

### Prerequisites
- Docker & Docker Compose
- API Keys for Gemini and Sendgrid/SMTP

### Local Development (Using Docker)
To build and run the complete application stack locally:

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Swagger Documentation**: http://localhost:8000/docs

## Deployment Configuration

### Frontend: Vercel
1. Push this repository to GitHub.
2. Log into Vercel and import the project.
3. Set the Framework Preset to **Vite**.
4. Set the Root Directory to `frontend`.
5. Add the environment variable `VITE_API_URL` pointing to the Render backend URL (e.g., `https://my-backend.onrender.com`).
6. Deploy.

### Backend: Render
1. Create a new Web Service on Render.
2. Link your GitHub repository.
3. Configure settings:
   - Root Directory: `.` (or leave blank, Dockerfile is at root)
   - Environment: `Docker`
4. Add all required Environment Variables (`GEMINI_API_KEY`, `SMTP_*`, etc.).
5. Deploy.
