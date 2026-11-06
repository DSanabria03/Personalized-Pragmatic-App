from fastapi import FastAPI, HTTPException, status
from schemas import LoginRequest

app = FastAPI(title="Personalized Pragmatic App")

@app.get("/")
def read_root():
    return {"message": "OK"}

@app.post("/api/login")
def login(credentials: LoginRequest):
    if credentials.email == "user@user.com" and credentials.password == "password":
        return {
            "success": True,
            "message": "Login exitoso",
            "token": "fake-jwt-token-pip"
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Correo o contraseña incorrectos"
    )