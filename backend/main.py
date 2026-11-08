from fastapi import FastAPI, HTTPException, status
from schemas import LoginRequest
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Personalized Pragmatic App")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"],)

@app.get("/")
def read_root():
    return {"message": "OK"}

@app.post("/api/login")
def login(credentials: LoginRequest):
    if credentials.email == "user@user.com" and credentials.password == "password":
        return {
            "success": True,
            "message": "Login",
            "token": "fake-jwt-token-pip"
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email or password incorrect"
    )