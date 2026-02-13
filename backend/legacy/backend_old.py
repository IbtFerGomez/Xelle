# backend.py - V5.6 FINAL FIX
import urllib.parse
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, JSON, Boolean, DateTime
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from fastapi.middleware.cors import CORSMiddleware
from typing import Any, Dict, List, Optional
from datetime import datetime

# --- CONFIGURACIÓN BD ---
# Si tu contraseña tiene caracteres especiales, esto lo arregla:
TU_CONTRASENA_REAL = "123" 
encoded_password = urllib.parse.quote_plus(TU_CONTRASENA_REAL)
DATABASE_URL = f"postgresql://postgres:{encoded_password}@localhost:5432/xelle_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELOS ---
class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    full_name = Column(String)
    role = Column(String) # super_admin, quality_manager, etc.
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

# --- AUTO-REPARACIÓN DE ADMIN ---
def repair_admin():
    db = SessionLocal()
    try:
        user = db.query(UserDB).filter(UserDB.username == "Xelle_Fer").first()
        if not user:
            print("🔧 Creando usuario maestro 'Xelle_Fer'...")
            user = UserDB(username="Xelle_Fer", password_hash="123", full_name="Admin Sistema", role="super_admin", module_access=["all"], active=True)
            db.add(user)
        else:
            # Asegurar rol correcto
            user.role = "super_admin"
            user.module_access = ["all"]
            user.active = True
        
        db.commit()
        print("✅ Usuario 'Xelle_Fer' verificado como SUPER_ADMIN.")
    except Exception as e:
        print(f"⚠️ Error verificando admin: {e}")
    finally:
        db.close()

repair_admin()

# --- API ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- RUTAS ---
class LoginInput(BaseModel):
    username: str
    password: str

@app.post("/api/login")
def login(creds: LoginInput, db: Session = Depends(get_db)):
    u = db.query(UserDB).filter(UserDB.username.ilike(creds.username)).first()
    if not u or u.password_hash != creds.password: return {"success": False, "msg": "Datos incorrectos"}
    if not u.active: return {"success": False, "msg": "Usuario inactivo"}
    
    return {"success": True, "user": {"id": u.id, "username": u.username, "fullName": u.full_name, "role": u.role, "moduleAccess": u.module_access}}

# CRUD Usuarios
class UserSchema(BaseModel):
    username: str
    password: Optional[str] = None
    fullName: str
    role: str
    moduleAccess: List[str]
    active: Optional[bool] = True

@app.get("/api/users")
def get_users(db: Session = Depends(get_db)): return db.query(UserDB).all()

@app.post("/api/users")
def create_user(u: UserSchema, db: Session = Depends(get_db)):
    pwd = u.password if u.password else "123"
    new_u = UserDB(username=u.username, password_hash=pwd, full_name=u.fullName, role=u.role, module_access=u.moduleAccess, active=u.active)
    try: db.add(new_u); db.commit(); return {"status": "ok"}
    except: raise HTTPException(400, "Usuario existente")

@app.put("/api/users/{uid}")
def update_user(uid: int, u: UserSchema, db: Session = Depends(get_db)):
    curr = db.query(UserDB).filter(UserDB.id == uid).first()
    if not curr: raise HTTPException(404)
    curr.username = u.username; curr.full_name = u.fullName; curr.role = u.role; curr.module_access = u.moduleAccess; curr.active = u.active
    if u.password: curr.password_hash = u.password
    db.commit()
    return {"status": "updated"}

# CRUD Formatos
class FmtSchema(BaseModel):
    code: str
    title: str
    area: str
    file_path: str

@app.get("/api/formats") # Para dashboard (activos)
def get_fmts(db: Session = Depends(get_db)): return db.query(FormatMetadataDB).filter(FormatMetadataDB.active == True).all()

@app.get("/api/formats_admin") # Para admin (todos)
def get_all_fmts(db: Session = Depends(get_db)): return db.query(FormatMetadataDB).all()

@app.post("/api/formats")
def add_fmt(f: FmtSchema, db: Session = Depends(get_db)):
    try: db.add(FormatMetadataDB(**f.dict())); db.commit(); return {"status": "ok"}
    except: raise HTTPException(400, "Código duplicado")

@app.put("/api/formats/{fid}")
def edit_fmt(fid: int, f: FmtSchema, db: Session = Depends(get_db)):
    curr = db.query(FormatMetadataDB).filter(FormatMetadataDB.id == fid).first()
    if curr:
        curr.code = f.code; curr.title = f.title; curr.area = f.area; curr.file_path = f.file_path
        db.commit()
    return {"status": "updated"}

@app.delete("/api/formats/{fid}") # Soft Delete (Toggle)
def toggle_fmt(fid: int, db: Session = Depends(get_db)):
    f = db.query(FormatMetadataDB).filter(FormatMetadataDB.id == fid).first()
    if f: f.active = not f.active; db.commit()
    return {"status": "ok"}

# Historial
class RecInput(BaseModel):
    format_code: str; data_payload: Dict[Any, Any]; user_id: int; record_key: Optional[str] = None

@app.post("/api/save_record")
def save(r: RecInput, db: Session = Depends(get_db)):
    existing = db.query(FormatRecordDB).filter(FormatRecordDB.format_code == r.format_code, FormatRecordDB.record_key == r.record_key).first() if r.record_key else None
    if existing:
        existing.data_payload = r.data_payload; existing.user_id = r.user_id; db.commit()
    else:
        db.add(FormatRecordDB(format_code=r.format_code, record_key=r.record_key or "DRAFT", data_payload=r.data_payload, user_id=r.user_id))
        db.commit()
    return {"status": "saved"}

@app.get("/api/history")
def history(db: Session = Depends(get_db)):
    return db.query(FormatRecordDB).order_by(FormatRecordDB.updated_at.desc()).limit(50).all()

# ADMIN ENDPOINTS
@app.get("/api/admin/users/stats")
def user_stats(db: Session = Depends(get_db)):
    """Estadísticas de usuarios para dashboard admin"""
    total = db.query(UserDB).count()
    admins = db.query(UserDB).filter(UserDB.role == "super_admin").count()
    managers = db.query(UserDB).filter(UserDB.role == "quality_manager").count()
    active = db.query(UserDB).filter(UserDB.active == True).count()
    return {"total": total, "admins": admins, "managers": managers, "active": active}

@app.delete("/api/users/{uid}")
def delete_user(uid: int, db: Session = Depends(get_db)):
    """Eliminar usuario (solo admins)"""
    u = db.query(UserDB).filter(UserDB.id == uid).first()
    if not u: raise HTTPException(404, "Usuario no encontrado")
    if u.role == "super_admin": raise HTTPException(403, "No puedes eliminar administradores")
    
    db.delete(u)
    db.commit()
    return {"status": "deleted"}

@app.patch("/api/users/{uid}/toggle-status")
def toggle_user_status(uid: int, db: Session = Depends(get_db)):
    """Activar/Desactivar usuario"""
    u = db.query(UserDB).filter(UserDB.id == uid).first()
    if not u: raise HTTPException(404, "Usuario no encontrado")
    
    u.active = not u.active
    db.commit()
    return {"status": "toggled", "active": u.active}

@app.get("/api/admin/audit")
def get_audit_log(db: Session = Depends(get_db)):
    """Obtener registro de auditoría (últimas 100 acciones)"""
    return db.query(FormatRecordDB).order_by(FormatRecordDB.created_at.desc()).limit(100).all()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)