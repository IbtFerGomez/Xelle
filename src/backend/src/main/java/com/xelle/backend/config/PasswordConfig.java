package com.xelle.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Configuración de encriptación de contraseñas usando BCrypt.
 * BCrypt es un algoritmo de hash adaptativo que incluye sal automática.
 */
@Configuration
public class PasswordConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Usar BCrypt con strength 12 (balance entre seguridad y rendimiento)
        return new BCryptPasswordEncoder(12);
    }
}
