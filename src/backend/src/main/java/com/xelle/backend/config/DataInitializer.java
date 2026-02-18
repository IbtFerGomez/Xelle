package com.xelle.backend.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xelle.backend.format.FormatMetadataEntity;
import com.xelle.backend.format.FormatMetadataRepository;
import com.xelle.backend.user.UserEntity;
import com.xelle.backend.user.UserRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FormatMetadataRepository formatRepository;
    private final ObjectMapper objectMapper;

    public DataInitializer(
        UserRepository userRepository,
        FormatMetadataRepository formatRepository,
        ObjectMapper objectMapper
    ) {
        this.userRepository = userRepository;
        this.formatRepository = formatRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) {
        ensureDefaultUsers();
        cleanupDeprecatedFormats();
        ensureDefaultFormats();
    }

    private void cleanupDeprecatedFormats() {
        formatRepository.findByCodeIgnoreCase("FO-LC-40-A").ifPresent(formatRepository::delete);
    }

    private void ensureDefaultUsers() {
        if (userRepository.count() > 0) {
            return;
        }
        userRepository.save(buildUser("Xelle_Fer", "123", "Luis Fernando Gómez", "super_admin", List.of("all"), true));
        userRepository.save(buildUser("calidad", "123", "Gerente de Calidad", "quality_manager", List.of("calidad", "sgc"), true));
        userRepository.save(buildUser("ventas", "123", "Ejecutivo Comercial", "sales", List.of("almacen"), true));
    }

    private UserEntity buildUser(String username, String pass, String fullName, String role, List<String> access, boolean active) {
        UserEntity user = new UserEntity();
        user.setUsername(username);
        user.setPasswordHash(pass);
        user.setFullName(fullName);
        user.setRole(role);
        user.setActive(active);
        user.setModuleAccess(toJson(access));
        return user;
    }

    private void ensureDefaultFormats() {
        if (formatRepository.count() > 0) {
            return;
        }
        addFormat("FO-LC-16", "Cover Sheet (Resumen Lote)", "banco", "formats/FO-LC-16.html");
        addFormat("FO-LC-20", "Procesamiento de Tejido", "banco", "formats/FO-LC-20.html");
        addFormat("FO-LC-21", "Bitácora de Cultivo Celular", "banco", "formats/FO-LC-21.html");
        addFormat("FO-LC-22", "Mapa de Crio-Conservación", "banco", "formats/FO-LC-22.html");
        addFormat("FO-LC-17", "Recepción Muestras (MP)", "calidad", "formats/FO-LC-17.html");
        addFormat("FO-LC-18", "Evaluación Macroscópica", "calidad", "formats/FO-LC-18.html");
        addFormat("FO-LC-19", "Liberación MP (Serología)", "calidad", "formats/FO-LC-19.html");
        addFormat("FO-LC-23", "Bitácora Movimientos Banco", "banco", "formats/FO-LC-23.html");
        addFormat("FO-LC-24", "Inventario Prod. Terminado", "banco", "formats/FO-LC-24.html");
        addFormat("FO-LC-25", "Preparación de Medios", "calidad", "formats/FO-LC-25.html");
        addFormat("FO-LC-26", "Bitácora de Autoclave", "calidad", "formats/FO-LC-26.html");
        addFormat("FO-LC-27", "Control de Equipos", "calidad", "formats/FO-LC-27.html");
        addFormat("FO-LC-28", "Uso de Equipos", "calidad", "formats/FO-LC-28.html");
        addFormat("FO-LC-29", "Hoja Prod. Lote Celular", "banco", "formats/FO-LC-29.html");
        addFormat("FO-LC-30", "Hoja Prod. Lote Acelular", "banco", "formats/FO-LC-30.html");
        addFormat("FO-LC-31", "Acondicionamiento Final", "almacen", "formats/FO-LC-31.html");
        addFormat("FO-LC-32", "Desviaciones (CAPA)", "sgc", "formats/FO-LC-32.html");
        addFormat("FO-LC-40", "Prep. Soluciones (Gral)", "calidad", "formats/FO-LC-40.html");
        addFormat("FO-LC-41", "Control Microbiológico", "calidad", "formats/FO-LC-41.html");
        addFormat("FO-LC-42", "Liofilización Placenta", "banco", "formats/FO-LC-42.html");
        addFormat("FO-LC-43", "Liofilización Medio Cond.", "banco", "formats/FO-LC-43.html");
        addFormat("FO-LC-44", "Lib. Micro Flasks/Viales", "calidad", "formats/FO-LC-44.html");
        addFormat("FO-LC-45", "Envío a Esterilización", "almacen", "formats/FO-LC-45.html");
        addFormat("FO-OP-15", "Pedido Maestro (Ventas)", "almacen", "formats/FO-OP-15.html");
        addFormat("FO-OP-16", "Orden de Surtido (Picking)", "almacen", "formats/FO-OP-16.html");
        addFormat("FO-OP-17", "Nota de Remisión", "almacen", "formats/FO-OP-17.html");
        addFormat("FO-OP-20", "Liberación a Almacén", "almacen", "formats/FO-OP-20.html");
    }

    private void addFormat(String code, String title, String area, String path) {
        FormatMetadataEntity entity = new FormatMetadataEntity();
        entity.setCode(code);
        entity.setTitle(title);
        entity.setArea(area);
        entity.setFilePath(path);
        entity.setActive(true);
        formatRepository.save(entity);
    }

    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException ex) {
            return "[]";
        }
    }
}
