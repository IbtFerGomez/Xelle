# 🔧 Solución al Problema de Login en XELLE

## ✅ Estado del Sistema (Verificado)
- Backend: **FUNCIONANDO** ✓
- Base de datos: **CONECTADA** ✓
- API /api/login: **OPERATIVA** ✓
- Usuarios registrados: **5 usuarios activos** ✓

## 🔑 Credenciales Disponibles

### Super Administrador
- **Usuario:** `Xelle_Fer`
- **Contraseña:** `123`

### Otros Usuarios
- **Usuario:** `calidad` | **Contraseña:** `123` (Gerente de Calidad)
- **Usuario:** `ventas` | **Contraseña:** `123` (Ejecutivo Comercial)
- **Usuario:** `Xelle_Admin` | **Contraseña:** `123` (Super Admin)
- **Usuario:** `Xelle_Nat` | **Contraseña:** `123` (Quality Manager)

---

## 🚀 SOLUCIONES RÁPIDAS

### Solución 1: Limpiar Caché del Navegador
1. Abrir http://localhost en tu navegador
2. Presionar **F12** para abrir las herramientas de desarrollador
3. Hacer clic derecho en el botón de refrescar (🔄)
4. Seleccionar **"Vaciar caché y volver a cargar de manera forzada"**
5. O usar el enlace dentro de la página: **"↻ Resetear Datos Locales"**

### Solución 2: Limpiar localStorage
1. En la página de login, presionar F12
2. Ir a la pestaña **Console**
3. Ejecutar:
```javascript
localStorage.clear();
location.reload();
```

### Solución 3: Reiniciar Contenedores Docker
```powershell
cd C:\Users\WINDOWS\Desktop\DriveProgra\Xelle
docker-compose restart
```

### Solución 4: Verificar en la Consola del Navegador
1. Presionar **F12**
2. Ir a la pestaña **Console**
3. Intentar hacer login
4. Ver si hay errores en rojo
5. Compartir los errores si los hay

---

## 🧪 Prueba Manual del API

Si quieres probar que el API funciona directamente:

```powershell
$body = @{username='Xelle_Fer'; password='123'} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost/api/login -Method POST -Body $body -ContentType 'application/json'
```

**Respuesta esperada:** ✅ `"success":true`

---

## 🔍 Diagnóstico Adicional

### Verificar servicios corriendo:
```powershell
docker ps
```

Deberías ver 3 contenedores activos:
- `xelle_backend` (healthy)
- `xelle_nginx` (running)
- `xelle_postgres` (healthy)

### Ver logs del backend:
```powershell
docker logs xelle_backend --tail 50
```

---

## 📞 Si el Problema Persiste

1. Prueba con otro navegador (Chrome, Firefox, Edge)
2. Verifica que no tengas extensiones bloqueando JavaScript
3. Asegúrate de estar usando http://localhost (no https)
4. Revisa si tu antivirus está bloqueando la conexión

---

**Última revisión:** 12 de marzo de 2026
**Versión del sistema:** XELLE LIMS v1.0
