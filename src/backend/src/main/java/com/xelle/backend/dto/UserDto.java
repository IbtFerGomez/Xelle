package com.xelle.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * DTO para operaciones de usuario (creación/actualización).
 * Separa el modelo de datos de la API.
 */
public class UserDto {

    private Long id;

    @NotBlank(message = "El usuario es requerido")
    @Size(min = 3, max = 50, message = "El usuario debe tener entre 3 y 50 caracteres")
    private String username;

    @Size(min = 3, max = 100, message = "La contraseña debe tener al menos 3 caracteres")
    private String password;

    private String fullName;

    private String role;

    private List<String> moduleAccess;

    private Boolean active;

    private Long actorUserId;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public List<String> getModuleAccess() {
        return moduleAccess;
    }

    public void setModuleAccess(List<String> moduleAccess) {
        this.moduleAccess = moduleAccess;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Long getActorUserId() {
        return actorUserId;
    }

    public void setActorUserId(Long actorUserId) {
        this.actorUserId = actorUserId;
    }
}
