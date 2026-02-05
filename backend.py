# backend.py - V2.0: Soporte Admin, Historial y Gestión de Formatos
import urllib.parse
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, JSON, Text, DateTime, Boolean
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from fastapi.middleware.cors import CORSMiddleware
from typing import Any, Dict, List, Optional
from datetime import datetime

# ==========================================
# 1. CONFIGURACIÓN
# ==========================================
TU_CONTRASENA_REAL = "TU_CONTRASEÑA_AQUI"  # <--- PON TU CONTRASEÑA
encoded_password = urllib.parse.quote_plus(TU_CONTRASENA_REAL)
DATABASE_URL = f"postgresql://postgres:{encoded_password}@localhost:5432/xelle_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==========================================
# 2. MODELOS (TABLAS MEJORADAS)
# ==========================================

class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    full_name = Column(String)
    role = Column(String) # super_admin, quality_manager, sales
    module_access = Column(JSON) # ["all"] o ["banco", "calidad"]
    active = Column(Boolean, default=True)

class FormatMetadataDB(Base):
    """Catálogo de Formatos (Tarjetas del Dashboard)"""
    __tablename__ = "format_metadata"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) # FO-LC-20
    title = Column(String)
    area = Column(String) # banco, calidad, etc.
    file_path = Column(String) # formats/FO-LC-20.html
    active = Column(Boolean, default=True)

class FormatRecordDB(Base):
    """Historial de Registros Guardados"""
    __tablename__ = "format_records"
    id = Column(Integer, primary_key=True, index=True)
    format_code = Column(String, index=True)
    record_key = Column(String) # Identificador único (ej: Código Barras)
    data_payload = Column(JSON)
    user_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# ==========================================
# 3. ENDPOINTS - GESTIÓN DE USUARIOS (ADMIN)
# ==========================================

class UserSchema(BaseModel):
    username: str
    password: str
    fullName: str
    role: str
    moduleAccess: List[str]

@app.get("/api/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(UserDB).all()

@app.post("/api/users")
def create_user(user: UserSchema, db: Session = Depends(get_db)):
    db_user = UserDB(
        username=user.username, 
        password_hash=user.password, # En prod usar hashing real
        full_name=user.fullName,
        role=user.role,
        module_access=user.moduleAccess
    )
    try:
        db.add(db_user)
        db.commit()
        return {"status": "created", "id": db_user.id}
    except:
        raise HTTPException(status_code=400, detail="Usuario ya existe")

@app.put("/api/users/{user_id}")
def update_user(user_id: int, user: UserSchema, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not db_user: raise HTTPException(status_code=404)
    
    db_user.full_name = user.fullName
    db_user.role = user.role
    db_user.module_access = user.moduleAccess
    if user.password: db_user.password_hash = user.password # Solo si envía nueva
    
    db.commit()
    return {"status": "updated"}

@app.delete("/api/users/{user_id}")
def toggle_user_active(user_id: int, db: Session = Depends(get_db)):
    """Desactivación lógica (Soft Delete)"""
    db_user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if db_user:
        db_user.active = not db_user.active
        db.commit()
    return {"status": "toggled", "active": db_user.active}

# ==========================================
# 4. ENDPOINTS - GESTIÓN DE FORMATOS (CARDS)
# ==========================================

@app.get("/api/formats")
def get_formats(db: Session = Depends(get_db)):
    return db.query(FormatMetadataDB).filter(FormatMetadataDB.active == True).all()

# ==========================================
# 5. ENDPOINTS - HISTORIAL Y OPERACIÓN
# ==========================================

class RecordInput(BaseModel):
    format_code: str
    data_payload: Dict[Any, Any]
    user_id: int
    record_key: Optional[str] = None # Ej: FO-LC-20-001

@app.post("/api/save_record")
def save_record(record: RecordInput, db: Session = Depends(get_db)):
    # Buscar si ya existe para actualizarlo (Edición)
    existing = None
    if record.record_key:
        existing = db.query(FormatRecordDB).filter(
            FormatRecordDB.format_code == record.format_code,
            FormatRecordDB.record_key == record.record_key
        ).first()

    if existing:
        existing.data_payload = record.data_payload
        existing.user_id = record.user_id # Actualiza quién lo modificó último
        db.commit()
        return {"status": "updated", "id": existing.id}
    else:
        new_rec = FormatRecordDB(
            format_code=record.format_code,
            record_key=record.record_key or "DRAFT",
            data_payload=record.data_payload,
            user_id=record.user_id
        )
        db.add(new_rec)
        db.commit()
        db.refresh(new_rec)
        return {"status": "created", "id": new_rec.id}

@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    """Obtiene los últimos 50 registros para el Dashboard"""
    return db.query(FormatRecordDB).order_by(FormatRecordDB.updated_at.desc()).limit(50).all()

# Endpoint de Login (V2)
class LoginInput(BaseModel):
    username: str
    password: str

@app.post("/api/login")
def login(creds: LoginInput, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == creds.username).first()
    if not user or user.password_hash != creds.password or not user.active:
        return {"success": False, "msg": "Credenciales inválidas o usuario inactivo"}
    
    return {
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "fullName": user.full_name,
            "role": user.role,
            "moduleAccess": user.module_access
        }
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 XELLE SYSTEM V2.0 (ADMIN ENABLED) LISTO: http://localhost:3000")
    uvicorn.run(app, host="0.0.0.0", port=3000)