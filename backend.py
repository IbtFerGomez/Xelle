# backend.py - V3.0: MASTER ADMIN (Usuarios + Formatos CRUD)
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
TU_CONTRASENA_REAL = "123"  # <--- TU CONTRASEÑA CORRECTA AQUÍ
encoded_password = urllib.parse.quote_plus(TU_CONTRASENA_REAL)
DATABASE_URL = f"postgresql://postgres:{encoded_password}@localhost:5432/xelle_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==========================================
# 2. MODELOS DB
# ==========================================

class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    full_name = Column(String)
    role = Column(String)
    module_access = Column(JSON)
    active = Column(Boolean, default=True)

class FormatMetadataDB(Base):
    __tablename__ = "format_metadata"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    title = Column(String)
    area = Column(String)
    file_path = Column(String)
    active = Column(Boolean, default=True)

class FormatRecordDB(Base):
    __tablename__ = "format_records"
    id = Column(Integer, primary_key=True, index=True)
    format_code = Column(String, index=True)
    record_key = Column(String)
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
# 3. ENDPOINTS - USUARIOS
# ==========================================
class UserSchema(BaseModel):
    username: str
    password: Optional[str] = None
    fullName: str
    role: str
    moduleAccess: List[str]

@app.get("/api/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(UserDB).all()

@app.post("/api/users")
def create_user(user: UserSchema, db: Session = Depends(get_db)):
    if not user.password: raise HTTPException(400, "Password requerido")
    db_user = UserDB(username=user.username, password_hash=user.password, full_name=user.fullName, role=user.role, module_access=user.moduleAccess)
    try:
        db.add(db_user)
        db.commit()
        return {"status": "created", "id": db_user.id}
    except: raise HTTPException(400, "Usuario duplicado")

@app.put("/api/users/{user_id}")
def update_user(user_id: int, user: UserSchema, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not db_user: raise HTTPException(404)
    db_user.full_name = user.fullName
    db_user.role = user.role
    db_user.module_access = user.moduleAccess
    if user.password: db_user.password_hash = user.password
    db.commit()
    return {"status": "updated"}

@app.delete("/api/users/{user_id}")
def toggle_user(user_id: int, db: Session = Depends(get_db)):
    u = db.query(UserDB).filter(UserDB.id == user_id).first()
    if u: 
        u.active = not u.active
        db.commit()
    return {"status": "ok"}

# ==========================================
# 4. ENDPOINTS - GESTIÓN FORMATOS (NUEVO)
# ==========================================
class FormatSchema(BaseModel):
    code: str
    title: str
    area: str
    file_path: str

@app.get("/api/formats_admin") # Para el panel de admin (ve todo)
def get_all_formats(db: Session = Depends(get_db)):
    return db.query(FormatMetadataDB).order_by(FormatMetadataDB.code).all()

@app.get("/api/formats") # Para el dashboard (solo activos)
def get_active_formats(db: Session = Depends(get_db)):
    return db.query(FormatMetadataDB).filter(FormatMetadataDB.active == True).all()

@app.post("/api/formats")
def create_format(fmt: FormatSchema, db: Session = Depends(get_db)):
    db_fmt = FormatMetadataDB(**fmt.dict())
    try:
        db.add(db_fmt)
        db.commit()
        return {"status": "created"}
    except: raise HTTPException(400, "Código duplicado")

@app.put("/api/formats/{fmt_id}")
def update_format(fmt_id: int, fmt: FormatSchema, db: Session = Depends(get_db)):
    f = db.query(FormatMetadataDB).filter(FormatMetadataDB.id == fmt_id).first()
    if not f: raise HTTPException(404)
    f.code = fmt.code
    f.title = fmt.title
    f.area = fmt.area
    f.file_path = fmt.file_path
    db.commit()
    return {"status": "updated"}

@app.delete("/api/formats/{fmt_id}")
def toggle_format(fmt_id: int, db: Session = Depends(get_db)):
    f = db.query(FormatMetadataDB).filter(FormatMetadataDB.id == fmt_id).first()
    if f:
        f.active = not f.active
        db.commit()
    return {"status": "ok"}

# ==========================================
# 5. ENDPOINTS - OPERACIÓN
# ==========================================
class RecordInput(BaseModel):
    format_code: str
    data_payload: Dict[Any, Any]
    user_id: int
    record_key: Optional[str] = None

@app.post("/api/save_record")
def save_record(record: RecordInput, db: Session = Depends(get_db)):
    existing = None
    if record.record_key:
        existing = db.query(FormatRecordDB).filter(FormatRecordDB.format_code == record.format_code, FormatRecordDB.record_key == record.record_key).first()
    
    if existing:
        existing.data_payload = record.data_payload
        existing.user_id = record.user_id
        db.commit()
        return {"status": "updated", "id": existing.id}
    
    new_rec = FormatRecordDB(format_code=record.format_code, record_key=record.record_key or "DRAFT", data_payload=record.data_payload, user_id=record.user_id)
    db.add(new_rec)
    db.commit()
    return {"status": "created", "id": new_rec.id}

@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(FormatRecordDB).order_by(FormatRecordDB.updated_at.desc()).limit(50).all()

@app.get("/api/get_record/{format_code}")
def get_last(format_code: str, db: Session = Depends(get_db)):
    return db.query(FormatRecordDB).filter(FormatRecordDB.format_code == format_code).order_by(FormatRecordDB.id.desc()).first()

class LoginInput(BaseModel):
    username: str
    password: str

@app.post("/api/login")
def login(creds: LoginInput, db: Session = Depends(get_db)):
    u = db.query(UserDB).filter(UserDB.username == creds.username).first()
    if not u or u.password_hash != creds.password or not u.active:
        return {"success": False, "msg": "Credenciales inválidas"}
    return {"success": True, "user": {"id": u.id, "username": u.username, "fullName": u.full_name, "role": u.role, "moduleAccess": u.module_access}}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)