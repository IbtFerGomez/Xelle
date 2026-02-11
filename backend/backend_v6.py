# backend.py - V6.0 WITH FORMAT PERSISTENCE
"""
Sistema completo de persistencia de formatos en PostgreSQL
- Generación de códigos únicos e irrepetiables
- CRUD de formatos con historial de cambios
- Auditoría completa
"""

import urllib.parse
import os
from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, JSON, Boolean, DateTime, Text, func, and_, ForeignKey
from sqlalchemy.orm import sessionmaker, Session, declarative_base, relationship
from fastapi.middleware.cors import CORSMiddleware
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
import uuid

# --- CONFIGURACIÓN BD ---
# Cargar variables de entorno con valores por defecto
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "123")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "xelle_db")

encoded_password = urllib.parse.quote_plus(DB_PASSWORD)
DATABASE_URL = f"postgresql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ========== MODELOS DE BD ==========

class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    full_name = Column(String)
    role = Column(String)
    module_access = Column(JSON)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

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

# ========== NUEVOS MODELOS PARA PERSISTENCIA DE FORMATOS ==========

class FormatInstanceDB(Base):
    """
    Tabla principal: Almacena cada instancia de formulario guardado
    Ejemplo: FO-LC-17-20260209-001, FO-LC-20-20260209-001, etc.
    """
    __tablename__ = "format_instances"
    
    id = Column(Integer, primary_key=True, index=True)
    unique_code = Column(String, unique=True, index=True)  # FO-LC-17-20260209-001
    format_type = Column(String, index=True)  # FO-LC-17, FO-LC-20, FO-LC-21, etc.
    status = Column(String, default="DRAFT", index=True)  # DRAFT, COMPLETED, APPROVED, ARCHIVED
    data_payload = Column(JSON)  # Todos los datos del formulario
    
    # Trazabilidad
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_by = Column(Integer)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Metadata adicional
    notes = Column(Text, nullable=True)
    print_count = Column(Integer, default=0)
    last_printed_at = Column(DateTime, nullable=True)
    metadata = Column(JSON, default={})
    
    # Relaciones
    creator = relationship("UserDB", foreign_keys=[created_by])

class FormatInstanceHistoryDB(Base):
    """
    Tabla de auditoría: Registra todas las acciones sobre instancias
    CREATED, EDITED, PRINTED, APPROVED, ARCHIVED
    """
    __tablename__ = "format_instance_history"
    
    id = Column(Integer, primary_key=True, index=True)
    format_instance_id = Column(Integer, ForeignKey("format_instances.id"))
    action = Column(String, index=True)  # CREATED, EDITED, PRINTED, APPROVED, ARCHIVED
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    changes = Column(JSON, nullable=True)  # { "field": "padre", "old_value": "X", "new_value": "Y" }
    details = Column(Text, nullable=True)

# Crear tabla
Base.metadata.create_all(bind=engine)

# ========== VALIDACIÓN Y REPARACIÓN ADMIN ==========

def repair_admin():
    """Auto-crear usuario admin si no existe"""
    db = SessionLocal()
    try:
        user = db.query(UserDB).filter(UserDB.username == "Xelle_Fer").first()
        if not user:
            print("🔧 Creando usuario maestro 'Xelle_Fer'...")
            user = UserDB(
                username="Xelle_Fer",
                password_hash="123",
                full_name="Admin Sistema",
                role="super_admin",
                module_access=["all"],
                active=True
            )
            db.add(user)
        else:
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

# ========== FASTAPI APP ==========

app = FastAPI(title="XELLE LIMS v6.0 - Format Persistence")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========== SCHEMAS PYDANTIC ==========

class LoginInput(BaseModel):
    username: str
    password: str

class UserSchema(BaseModel):
    username: str
    password: Optional[str] = None
    fullName: str
    role: str
    moduleAccess: List[str]
    active: Optional[bool] = True

class FmtSchema(BaseModel):
    code: str
    title: str
    area: str
    file_path: str

# ========== NUEVOS SCHEMAS PARA PERSISTENCIA ==========

class FormatInstanceCreate(BaseModel):
    """Para crear una nueva instancia de formato"""
    format_type: str  # FO-LC-17
    data_payload: Dict[str, Any]  # { inputs... }
    user_id: int
    status: str = "DRAFT"
    notes: Optional[str] = None

class FormatInstanceUpdate(BaseModel):
    """Para actualizar una instancia"""
    data_payload: Dict[str, Any]
    status: Optional[str] = None
    notes: Optional[str] = None
    user_id: int

class UniqueCodeResponse(BaseModel):
    """Respuesta al generar código único"""
    unique_code: str
    format_type: str
    timestamp: str
    barcode_text: str

# ========== RUTAS DE AUTENTICACIÓN (EXISTENTES) ==========

@app.post("/api/login")
def login(creds: LoginInput, db: Session = Depends(get_db)):
    u = db.query(UserDB).filter(UserDB.username.ilike(creds.username)).first()
    if not u or u.password_hash != creds.password:
        return {"success": False, "msg": "Datos incorrectos"}
    if not u.active:
        return {"success": False, "msg": "Usuario inactivo"}
    
    return {
        "success": True,
        "user": {
            "id": u.id,
            "username": u.username,
            "fullName": u.full_name,
            "role": u.role,
            "moduleAccess": u.module_access
        }
    }

# ========== CRUD USUARIOS (EXISTENTES) ==========

@app.get("/api/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(UserDB).all()

@app.post("/api/users")
def create_user(u: UserSchema, db: Session = Depends(get_db)):
    pwd = u.password if u.password else "123"
    new_u = UserDB(
        username=u.username,
        password_hash=pwd,
        full_name=u.fullName,
        role=u.role,
        module_access=u.moduleAccess,
        active=u.active
    )
    try:
        db.add(new_u)
        db.commit()
        return {"status": "ok"}
    except:
        raise HTTPException(400, "Usuario existente")

@app.put("/api/users/{uid}")
def update_user(uid: int, u: UserSchema, db: Session = Depends(get_db)):
    curr = db.query(UserDB).filter(UserDB.id == uid).first()
    if not curr:
        raise HTTPException(404)
    
    curr.username = u.username
    curr.full_name = u.fullName
    curr.role = u.role
    curr.module_access = u.moduleAccess
    curr.active = u.active
    if u.password:
        curr.password_hash = u.password
    
    db.commit()
    return {"status": "updated"}

# ========== NUEVAS RUTAS: GENERACIÓN DE CÓDIGOS ÚNICOS ==========

@app.post("/api/formats/generate-unique-code")
def generate_unique_code(data: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Genera un código único e irrepetiable para un formato
    Formato: FO-LC-17-20260209-001
    
    Input: { "format_type": "FO-LC-17", "user_id": 1 }
    Output: { "unique_code": "FO-LC-17-20260209-001", "barcode_text": "FO-LC-17-20260209-001" }
    """
    format_type = data.get("format_type", "")
    if not format_type:
        raise HTTPException(400, "format_type requerido")
    
    # Obtener fecha actual en formato YYYYMMDD
    today = datetime.utcnow().strftime("%Y%m%d")
    
    # Contar cuántos códigos de este tipo existen hoy
    existing_count = db.query(FormatInstanceDB).filter(
        and_(
            FormatInstanceDB.format_type == format_type,
            func.date_trunc('day', FormatInstanceDB.created_at) == datetime.strptime(today, "%Y%m%d")
        )
    ).count()
    
    # Generar secuencial (001, 002, 003, ...)
    sequential = str(existing_count + 1).zfill(3)
    unique_code = f"{format_type}-{today}-{sequential}"
    
    # Verificar que sea único (seguridad)
    if db.query(FormatInstanceDB).filter(FormatInstanceDB.unique_code == unique_code).first():
        raise HTTPException(400, "Código duplicado (error de concurrencia)")
    
    return {
        "unique_code": unique_code,
        "format_type": format_type,
        "timestamp": datetime.utcnow().isoformat(),
        "barcode_text": unique_code  # Para generar código de barras en frontend
    }

# ========== NUEVAS RUTAS: CRUD FORMATOS ==========

@app.post("/api/format-instances")
def create_format_instance(fmt: FormatInstanceCreate, db: Session = Depends(get_db)):
    """
    Crea y guarda una nueva instancia de formato
    POST: { "format_type": "FO-LC-17", "data_payload": {...}, "user_id": 1, "status": "DRAFT" }
    """
    # Generar código único
    today = datetime.utcnow().strftime("%Y%m%d")
    existing_count = db.query(FormatInstanceDB).filter(
        and_(
            FormatInstanceDB.format_type == fmt.format_type,
            func.date_trunc('day', FormatInstanceDB.created_at) == datetime.strptime(today, "%Y%m%d")
        )
    ).count()
    
    sequential = str(existing_count + 1).zfill(3)
    unique_code = f"{fmt.format_type}-{today}-{sequential}"
    
    # Crear instancia
    instance = FormatInstanceDB(
        unique_code=unique_code,
        format_type=fmt.format_type,
        status=fmt.status,
        data_payload=fmt.data_payload,
        created_by=fmt.user_id,
        notes=fmt.notes or ""
    )
    
    db.add(instance)
    db.flush()
    
    # Registrar en historial
    history = FormatInstanceHistoryDB(
        format_instance_id=instance.id,
        action="CREATED",
        user_id=fmt.user_id,
        details=f"Formato {fmt.format_type} creado"
    )
    db.add(history)
    db.commit()
    
    return {
        "success": True,
        "unique_code": unique_code,
        "format_type": fmt.format_type,
        "status": fmt.status,
        "created_at": instance.created_at.isoformat()
    }

@app.get("/api/format-instances/{unique_code}")
def get_format_instance(unique_code: str, db: Session = Depends(get_db)):
    """
    Obtiene una instancia de formato por código único
    GET /api/format-instances/FO-LC-17-20260209-001
    """
    instance = db.query(FormatInstanceDB).filter(
        FormatInstanceDB.unique_code == unique_code
    ).first()
    
    if not instance:
        raise HTTPException(404, "Formato no encontrado")
    
    return {
        "unique_code": instance.unique_code,
        "format_type": instance.format_type,
        "status": instance.status,
        "data_payload": instance.data_payload,
        "created_by": instance.created_by,
        "created_at": instance.created_at.isoformat(),
        "updated_at": instance.updated_at.isoformat(),
        "print_count": instance.print_count,
        "notes": instance.notes,
        "metadata": instance.metadata
    }

@app.get("/api/format-instances")
def list_format_instances(
    format_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    created_by: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(20),
    db: Session = Depends(get_db)
):
    """
    Lista formatos guardados con filtros y paginación
    GET /api/format-instances?format_type=FO-LC-17&status=COMPLETED&skip=0&limit=10
    """
    query = db.query(FormatInstanceDB)
    
    # Filtros
    if format_type:
        query = query.filter(FormatInstanceDB.format_type == format_type)
    
    if status:
        query = query.filter(FormatInstanceDB.status == status)
    
    if created_by:
        query = query.filter(FormatInstanceDB.created_by == created_by)
    
    if date_from:
        try:
            df = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(FormatInstanceDB.created_at >= df)
        except:
            pass
    
    if date_to:
        try:
            dt = datetime.strptime(date_to, "%Y-%m-%d")
            dt = dt.replace(hour=23, minute=59, second=59)
            query = query.filter(FormatInstanceDB.created_at <= dt)
        except:
            pass
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            FormatInstanceDB.unique_code.ilike(search_pattern) |
            FormatInstanceDB.notes.ilike(search_pattern)
        )
    
    # Contar total
    total = query.count()
    
    # Ordenar por fecha descendente + paginar
    instances = query.order_by(FormatInstanceDB.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [
            {
                "unique_code": i.unique_code,
                "format_type": i.format_type,
                "status": i.status,
                "created_by": i.created_by,
                "created_at": i.created_at.isoformat(),
                "updated_at": i.updated_at.isoformat(),
                "print_count": i.print_count
            }
            for i in instances
        ]
    }

@app.put("/api/format-instances/{unique_code}")
def update_format_instance(
    unique_code: str,
    update_data: FormatInstanceUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualiza una instancia de formato
    PUT /api/format-instances/FO-LC-17-20260209-001
    """
    instance = db.query(FormatInstanceDB).filter(
        FormatInstanceDB.unique_code == unique_code
    ).first()
    
    if not instance:
        raise HTTPException(404, "Formato no encontrado")
    
    # Registrar cambios
    changes = {}
    if update_data.status and update_data.status != instance.status:
        changes["status"] = {
            "old_value": instance.status,
            "new_value": update_data.status
        }
        instance.status = update_data.status
    
    if update_data.notes != instance.notes:
        changes["notes"] = {
            "old_value": instance.notes,
            "new_value": update_data.notes
        }
        instance.notes = update_data.notes
    
    instance.data_payload = update_data.data_payload
    instance.updated_by = update_data.user_id
    instance.updated_at = datetime.utcnow()
    
    db.commit()
    
    # Registrar en historial
    history = FormatInstanceHistoryDB(
        format_instance_id=instance.id,
        action="EDITED",
        user_id=update_data.user_id,
        changes=changes if changes else None
    )
    db.add(history)
    db.commit()
    
    return {"success": True, "unique_code": unique_code}

@app.delete("/api/format-instances/{unique_code}")
def delete_format_instance(unique_code: str, user_id: int, db: Session = Depends(get_db)):
    """
    Soft-delete: Marca como ARCHIVED en lugar de eliminar físicamente
    DELETE /api/format-instances/FO-LC-17-20260209-001?user_id=1
    """
    instance = db.query(FormatInstanceDB).filter(
        FormatInstanceDB.unique_code == unique_code
    ).first()
    
    if not instance:
        raise HTTPException(404, "Formato no encontrado")
    
    instance.status = "ARCHIVED"
    instance.updated_by = user_id
    instance.updated_at = datetime.utcnow()
    db.commit()
    
    # Registrar en historial
    history = FormatInstanceHistoryDB(
        format_instance_id=instance.id,
        action="ARCHIVED",
        user_id=user_id,
        details="Formato marcado como archivado"
    )
    db.add(history)
    db.commit()
    
    return {"success": True, "unique_code": unique_code}

# ========== RUTAS: IMPRESIÓN Y AUDITORÍA ==========

@app.post("/api/format-instances/{unique_code}/print")
def register_print(unique_code: str, user_id: int, db: Session = Depends(get_db)):
    """
    Registra que un formato fue impreso
    POST /api/format-instances/FO-LC-17-20260209-001/print?user_id=1
    """
    instance = db.query(FormatInstanceDB).filter(
        FormatInstanceDB.unique_code == unique_code
    ).first()
    
    if not instance:
        raise HTTPException(404, "Formato no encontrado")
    
    instance.print_count += 1
    instance.last_printed_at = datetime.utcnow()
    db.commit()
    
    # Registrar en historial
    history = FormatInstanceHistoryDB(
        format_instance_id=instance.id,
        action="PRINTED",
        user_id=user_id,
        details=f"Impresión #{instance.print_count}"
    )
    db.add(history)
    db.commit()
    
    return {"success": True, "print_count": instance.print_count}

@app.get("/api/format-instances/{unique_code}/history")
def get_format_history(unique_code: str, db: Session = Depends(get_db)):
    """
    Obtiene el historial completo de cambios de un formato
    GET /api/format-instances/FO-LC-17-20260209-001/history
    """
    instance = db.query(FormatInstanceDB).filter(
        FormatInstanceDB.unique_code == unique_code
    ).first()
    
    if not instance:
        raise HTTPException(404, "Formato no encontrado")
    
    history = db.query(FormatInstanceHistoryDB).filter(
        FormatInstanceHistoryDB.format_instance_id == instance.id
    ).order_by(FormatInstanceHistoryDB.timestamp.desc()).all()
    
    return {
        "unique_code": unique_code,
        "history": [
            {
                "action": h.action,
                "user_id": h.user_id,
                "timestamp": h.timestamp.isoformat(),
                "changes": h.changes,
                "details": h.details
            }
            for h in history
        ]
    }

# ========== RUTAS: ESTADÍSTICAS ==========

@app.get("/api/format-instances/stats/overview")
def get_format_stats(db: Session = Depends(get_db)):
    """
    Estadísticas generales de formatos guardados
    GET /api/format-instances/stats/overview
    """
    total = db.query(FormatInstanceDB).count()
    
    # Por estado
    by_status = {}
    for status in ["DRAFT", "COMPLETED", "APPROVED"]:
        count = db.query(FormatInstanceDB).filter(FormatInstanceDB.status == status).count()
        by_status[status] = count
    
    # Por tipo
    by_type = {}
    types = db.query(FormatInstanceDB.format_type).distinct().all()
    for (ftype,) in types:
        count = db.query(FormatInstanceDB).filter(FormatInstanceDB.format_type == ftype).count()
        by_type[ftype] = count
    
    # Últimas 24h
    last_24h = db.query(FormatInstanceDB).filter(
        FormatInstanceDB.created_at >= datetime.utcnow() - timedelta(hours=24)
    ).count()
    
    # Más imprimidos
    most_printed = db.query(FormatInstanceDB.unique_code, FormatInstanceDB.print_count).order_by(
        FormatInstanceDB.print_count.desc()
    ).limit(5).all()
    
    return {
        "total": total,
        "by_status": by_status,
        "by_type": by_type,
        "last_24h": last_24h,
        "most_printed": [
            {"unique_code": code, "print_count": count}
            for code, count in most_printed
        ]
    }

# ========== RUTAS: FORMATOS METADATA (EXISTENTES) ==========

@app.get("/api/formats")
def get_fmts(db: Session = Depends(get_db)):
    return db.query(FormatMetadataDB).filter(FormatMetadataDB.active == True).all()

@app.get("/api/formats_admin")
def get_all_fmts(db: Session = Depends(get_db)):
    return db.query(FormatMetadataDB).all()

@app.post("/api/formats")
def add_fmt(f: FmtSchema, db: Session = Depends(get_db)):
    try:
        db.add(FormatMetadataDB(**f.dict()))
        db.commit()
        return {"status": "ok"}
    except:
        raise HTTPException(400, "Código duplicado")

@app.put("/api/formats/{fid}")
def edit_fmt(fid: int, f: FmtSchema, db: Session = Depends(get_db)):
    curr = db.query(FormatMetadataDB).filter(FormatMetadataDB.id == fid).first()
    if curr:
        curr.code = f.code
        curr.title = f.title
        curr.area = f.area
        curr.file_path = f.file_path
        db.commit()
    return {"status": "updated"}

@app.delete("/api/formats/{fid}")
def toggle_fmt(fid: int, db: Session = Depends(get_db)):
    f = db.query(FormatMetadataDB).filter(FormatMetadataDB.id == fid).first()
    if f:
        f.active = not f.active
        db.commit()
    return {"status": "ok"}

# ========== ADMIN ENDPOINTS (EXISTENTES) ==========

@app.get("/api/admin/users/stats")
def user_stats(db: Session = Depends(get_db)):
    total = db.query(UserDB).count()
    admins = db.query(UserDB).filter(UserDB.role == "super_admin").count()
    managers = db.query(UserDB).filter(UserDB.role == "quality_manager").count()
    active = db.query(UserDB).filter(UserDB.active == True).count()
    return {"total": total, "admins": admins, "managers": managers, "active": active}

@app.delete("/api/users/{uid}")
def delete_user(uid: int, db: Session = Depends(get_db)):
    u = db.query(UserDB).filter(UserDB.id == uid).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    if u.role == "super_admin":
        raise HTTPException(403, "No puedes eliminar administradores")
    
    db.delete(u)
    db.commit()
    return {"status": "deleted"}

@app.patch("/api/users/{uid}/toggle-status")
def toggle_user_status(uid: int, db: Session = Depends(get_db)):
    u = db.query(UserDB).filter(UserDB.id == uid).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    
    u.active = not u.active
    db.commit()
    return {"status": "toggled", "active": u.active}

@app.get("/api/admin/audit")
def get_audit_log(db: Session = Depends(get_db)):
    return db.query(FormatRecordDB).order_by(FormatRecordDB.created_at.desc()).limit(100).all()

# ===== HEALTH CHECK ENDPOINTS =====
@app.get("/health")
def health_check():
    """Health check endpoint para Docker"""
    try:
        # Verificar conexión con BD
        with SessionLocal() as session:
            session.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": "disconnected", "error": str(e)}, 503

@app.get("/api/health")
def api_health_check():
    """API health check endpoint"""
    return {
        "status": "ok",
        "version": "6.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.on_event("startup")
async def startup_event():
    """Crear tablas al iniciar"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Base de datos inicializada correctamente")
    except Exception as e:
        print(f"❌ Error al inicializar BD: {e}")
# ========== MAIN ==========

if __name__ == "__main__":
    import uvicorn
    print("🚀 XELLE LIMS v6.0 - Iniciando servidor con persistencia de formatos...")
    uvicorn.run(app, host="0.0.0.0", port=3000)
