from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from schemas import LoginRequest

app = FastAPI(title="Personalized Pragmatic App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Backend de Pip funcionando correctamente"}

@app.post("/api/login")
def login(credentials: LoginRequest):
    if credentials.email == "you@practice.com" and credentials.password == "123456":
        return {
            "success": True,
            "message": "Login exitoso",
            "token": "fake-jwt-token-pip"
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Correo o contraseña incorrectos"
    )