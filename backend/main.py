import os
import io
import pandas as pd
from pydantic import EmailStr
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from email_service import send_email_summary
from ai_service import generate_summary

app = FastAPI(title="Sales Insight Automator API", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {".csv", ".xlsx"}
MAX_FILE_SIZE = 5 * 1024 * 1024 # 5 MB

@app.post("/upload", summary="Upload Sales Data and Generate AI Summary")
async def upload_file(
    file: UploadFile = File(...),
    email_address: EmailStr = Form(...)
):
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only CSV and XLSX are allowed."
        )
    
    # Read file content
    contents = await file.read()
    
    # Validate file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the allowable limit of 5 MB."
        )
    
    # Parse dataset with pandas
    try:
        if file_ext == ".csv":
            df = pd.read_csv(io.BytesIO(contents))
        elif file_ext == ".xlsx":
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse file: {str(e)}"
        )
    
    # Generate Summary using AI Service
    try:
        ai_summary = generate_summary(df)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )
    
    # Send Email
    try:
        send_email_summary(email_address, ai_summary)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )
    
    return {
        "status": "success",
        "summary": ai_summary
    }

@app.get("/health", summary="Health Check")
def health_check():
    return {"status": "healthy"}
