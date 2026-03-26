package com.xelle.backend.service;

import com.xelle.backend.audit.AuditLogEntity;
import com.xelle.backend.audit.AuditLogRepository;
import com.xelle.backend.dto.LoginRequest;
import com.xelle.backend.exception.UnauthorizedException;
import com.xelle.backend.user.UserEntity;
import com.xelle.backend.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio de autenticación con BCrypt password hashing.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogRepository auditLogRepository;

    public AuthService(UserRepository userRepository, 
                      PasswordEncoder passwordEncoder,
                      AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Autentica un usuario con credenciales.
     * @param loginRequest Credenciales del usuario
     * @return Información del usuario autenticado
     * @throws UnauthorizedException si las credenciales son inválidas
     */
    public Map<String, Object> login(LoginRequest loginRequest) {
        Optional<UserEntity> userOpt = userRepository.findByUsernameIgnoreCase(loginRequest.getUsername());
        
        if (userOpt.isEmpty()) {
            logFailedLogin(loginRequest.getUsername(), null, "user_not_found");
            throw new UnauthorizedException("Credenciales inválidas");
        }

        UserEntity user = userOpt.get();

        if (!user.isActive()) {
            logFailedLogin(loginRequest.getUsername(), user.getId(), "user_inactive");
            throw new UnauthorizedException("Usuario inactivo");
        }

        // Verificar contraseña con BCrypt
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            logFailedLogin(loginRequest.getUsername(), user.getId(), "bad_password");
            throw new UnauthorizedException("Credenciales inválidas");
        }

        // Login exitoso
        logSuccessfulLogin(user);

        return buildUserSession(user);
    }

    /**
     * Construye el objeto de sesión del usuario.
     */
    private Map<String, Object> buildUserSession(UserEntity user) {
        Map<String, Object> session = new HashMap<>();
        session.put("id", user.getId());
        session.put("userId", user.getId());
        session.put("user_id", user.getId());
        session.put("username", user.getUsername());
        session.put("user", user.getUsername());
        session.put("fullName", user.getFullName());
        session.put("name", user.getFullName());
        session.put("role", user.getRole() != null ? user.getRole() : "user");
        
        // Parsear moduleAccess de JSON
        try {
            String moduleAccessJson = user.getModuleAccess();
            if (moduleAccessJson != null && !moduleAccessJson.isBlank()) {
                // Simplemente pasar el JSON string, el frontend lo parseará
                session.put("moduleAccess", moduleAccessJson);
                session.put("access", moduleAccessJson);
            } else {
                session.put("moduleAccess", "[]");
                session.put("access", "[]");
            }
        } catch (Exception e) {
            session.put("moduleAccess", "[]");
            session.put("access", "[]");
        }

        return session;
    }

    /**
     * Registra intento fallido de login en auditoría.
     */
    private void logFailedLogin(String username, Long userId, String reason) {
        AuditLogEntity log = new AuditLogEntity();
        log.setAction("LOGIN_FAILED");
        log.setEntityType("AUTH");
        log.setEntityKey(username != null ? username : "unknown");
        log.setUserId(userId);
        log.setUsername(username);
        log.setDetails("{\"reason\":\"" + reason + "\"}");
        auditLogRepository.save(log);
    }

    /**
     * Registra login exitoso en auditoría.
     */
    private void logSuccessfulLogin(UserEntity user) {
        AuditLogEntity log = new AuditLogEntity();
        log.setAction("LOGIN_SUCCESS");
        log.setEntityType("AUTH");
        log.setEntityKey(user.getUsername());
        log.setUserId(user.getId());
        log.setUsername(user.getUsername());
        log.setDetails("{\"role\":\"" + (user.getRole() != null ? user.getRole() : "") + "\"}");
        auditLogRepository.save(log);
    }
}
