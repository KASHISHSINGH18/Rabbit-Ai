# Sales Insight Automator

## Project Overview

Sales Insight Automator is a complete, containerized full-stack web application. It allows business users to upload a raw CSV or XLSX sales data file, enter their email address, and receive an instant, AI-generated executive summary analyzing their sales data.

The project uses the **Google Gemini API** to generate powerful business intelligence summaries and handles automated delivery using SendGrid or SMTP securely.

## Architecture Map

```mermaid
graph TD;
    Client[React Frontend] -->|POST /upload (CSV/XLSX + Email)| Backend[Node.js Express API];
    Backend -->|Parse Data| DataBuffer[XLSX Parser];
    DataBuffer -->|Analyze Sample| Gemini[Google Gemini API];
    Gemini -->|AI Summary String| Backend;
    Backend -->|Dispatch Email| EmailService[SendGrid / Nodemailer];
    EmailService -->|Delivers to| Inbox[End User Inbox];
```

## Security & Protections Implemented

To prepare this application for production use, strict protections have been applied to the API:
- **File Type Validation**: Only `.csv` and `.xlsx` files are permitted. Multer middleware rejects unintended executable payloads instantly.
- **Max File Size Guard**: Uploads are strictly capped at 5MB preventing memory-starvation DDOS attempts.
- **Input Sanitization**: Email addresses undergo RegExp sanitization validating syntax before processing or storing in memory.
- **Secret Management**: Cloud keys, API credentials, and mail passwords are read safely from `.env` parameters; the frontend compiles strictly off `VITE_API_URL` without exposing tokens.

## Application Endpoints

### `POST /upload`
Expects `multipart/form-data`:
- `file`: `(binary, 5MB max)` The dataset to analyze.
- `email_address`: `(string, email syntax)` The destination inbox.

Returns JSON format indicating status (success/failure) and the generated summary string.

### `/docs`
An interactive **Swagger UI** generated via OpenAPI v3 running natively. Use it to instantly test endpoints and inspect HTTP request/response schemas.

---

## 🛠 Local Setup & Development

### 1. Environment Setup

Copy the environment template and configure your secrets:
```bash
cp .env.example .env
```

You must configure the following in `.env`:
- `GEMINI_API_KEY`: Your working Google AI Studio API key.
- `SMTP_HOST`: e.g. `smtp.gmail.com`
- `SMTP_PORT`: e.g. `587`
- `SMTP_USER`: Your email
- `SMTP_PASS`: Your app-specific password
- `FROM_EMAIL`: The reply-to header email

### 2. Docker Usage (Recommended)

To spin up the completely containerized environment:

```bash
docker-compose up --build
```
* **Frontend UI**: http://localhost:5173
* **Backend API**: http://localhost:8000
* **API Documentation**: http://localhost:8000/docs

---

## 🚀 Cloud Deployment Instructions

The project is built around `.github/workflows/ci.yml` strictly ensuring pull requests successfully build nodes, test integration layouts, and validate Docker builds before shipping.

### Frontend Deployment → Vercel
1. Push this repository to GitHub.
2. Import the project in the Vercel Dashboard.
3. Set the Framework Preset to **Vite** and Root Directory to `frontend`.
4. Provide the environment variable `VITE_API_URL` equating to your Render backend URL.
5. Deploy.

### Backend Deployment → Render
1. Create a **New Web Service** on Render.
2. Link your GitHub repository.
3. Configure settings:
   - Root Directory: `.`
   - Environment: **Docker**
4. Bind Environment Variables: Populate all API keys (`GEMINI_API_KEY`, etc.) within the Render UI secrets configuration.
5. Deploy.
