package com.xelle.backend.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xelle.backend.format.FormatMetadataEntity;
import com.xelle.backend.format.FormatMetadataRepository;
import com.xelle.backend.instance.FormatInstanceEntity;
import com.xelle.backend.instance.FormatInstanceRepository;
import com.xelle.backend.record.FormatRecordEntity;
import com.xelle.backend.record.FormatRecordRepository;
import com.xelle.backend.user.UserEntity;
import com.xelle.backend.user.UserRepository;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FormatMetadataRepository formatRepository;
    private final FormatInstanceRepository instanceRepository;
    private final FormatRecordRepository recordRepository;
    private final ObjectMapper objectMapper;

    public DataInitializer(
            UserRepository userRepository,
            FormatMetadataRepository formatRepository,
            FormatInstanceRepository instanceRepository,
            FormatRecordRepository recordRepository,
            ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.formatRepository = formatRepository;
        this.instanceRepository = instanceRepository;
        this.recordRepository = recordRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) {
        ensureDefaultUsers();
        cleanupDeprecatedFormats();
        ensureDefaultFormats();
    }

    private void cleanupDeprecatedFormats() {
        migrateLegacyFormatCode("FO-OP-12", "FO-LC-12");
        formatRepository.findByCodeIgnoreCase("FO-LC-40-A").ifPresent(formatRepository::delete);
        formatRepository.findByCodeIgnoreCase("FO-LC-31").ifPresent(formatRepository::delete);
        formatRepository.findByCodeIgnoreCase("FO-OP-12").ifPresent(formatRepository::delete);
    }

    private void migrateLegacyFormatCode(String oldCode, String newCode) {
        OffsetDateTime now = OffsetDateTime.now();

        List<FormatInstanceEntity> instances = instanceRepository.findByFormatTypeIgnoreCase(oldCode);
        if (!instances.isEmpty()) {
            for (FormatInstanceEntity instance : instances) {
                instance.setFormatType(newCode);
                instance.setUpdatedAt(now);
            }
            instanceRepository.saveAll(instances);
        }

        List<FormatRecordEntity> records = recordRepository.findByFormatCodeIgnoreCase(oldCode);
        if (!records.isEmpty()) {
            for (FormatRecordEntity record : records) {
                record.setFormatCode(newCode);
                record.setUpdatedAt(now);
            }
            recordRepository.saveAll(records);
        }
    }

    private void ensureDefaultUsers() {
        if (userRepository.count() > 0) {
            return;
        }
        userRepository.save(buildUser("Xelle_Fer", "123", "Luis Fernando Gómez", "super_admin", List.of("all"), true));
        userRepository.save(
                buildUser("calidad", "123", "Gerente de Calidad", "quality_manager", List.of("calidad", "sgc"), true));
        userRepository.save(buildUser("ventas", "123", "Ejecutivo Comercial", "sales", List.of("almacen"), true));
    }

    private UserEntity buildUser(String username, String pass, String fullName, String role, List<String> access,
            boolean active) {
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
        upsertFormat("FO-LC-14", "Histórico de Placentas", "sgc", "formats/FO-LC-14.html");
        upsertFormat("FO-LC-15", "Histórico de Líneas", "sgc", "formats/FO-LC-15.html");
        upsertFormat("FO-LC-16", "Cover Sheet (Resumen Lote)", "banco", "formats/FO-LC-16.html");
        upsertFormat("FO-LC-17", "Recepción Muestras (MP)", "calidad", "formats/FO-LC-17.html");
        upsertFormat("FO-LC-18", "Evaluación Macroscópica", "calidad", "formats/FO-LC-18.html");
        upsertFormat("FO-LC-19", "Liberación MP (Serología)", "calidad", "formats/FO-LC-19.html");
        upsertFormat("FO-LC-20", "Procesamiento de Tejido", "banco", "formats/FO-LC-20.html");
        upsertFormat("FO-LC-21", "Bitácora de Cultivo Celular", "banco", "formats/FO-LC-21.html");
        upsertFormat("FO-LC-22", "Mapa de Crio-Conservación", "banco", "formats/FO-LC-22.html");
        upsertFormat("FO-LC-23", "Bitácora Movimientos Banco", "banco", "formats/FO-LC-23.html");
        upsertFormat("FO-LC-24", "Inventario Prod. Terminado", "banco", "formats/FO-LC-24.html");
        upsertFormat("FO-LC-25", "Preparación de Medios", "calidad", "formats/FO-LC-25.html");
        upsertFormat("FO-LC-26", "Bitácora de Autoclave", "calidad", "formats/FO-LC-26.html");
        upsertFormat("FO-LC-27", "Control de Equipos", "calidad", "formats/FO-LC-27.html");
        upsertFormat("FO-LC-28", "Uso de Equipos", "calidad", "formats/FO-LC-28.html");
        upsertFormat("FO-LC-29", "REGISTRO DE LOTE DE PRODUCTO TERMINADO (CELULAR)", "banco", "formats/FO-LC-29.html");
        upsertFormat("FO-LC-30", "Hoja Prod. Lote Acelular", "banco", "formats/FO-LC-30.html");
        upsertFormat("FO-LC-32", "Desviaciones (CAPA)", "sgc", "formats/FO-LC-32.html");
        upsertFormat("FO-LC-40", "Prep. Soluciones (Gral)", "calidad", "formats/FO-LC-40.html");
        upsertFormat("FO-LC-40-B", "Prep. Soluciones (Alterno B)", "calidad", "formats/FO-LC-40-B.html");
        upsertFormat("FO-LC-41", "Control Microbiológico", "calidad", "formats/FO-LC-41.html");
        upsertFormat("FO-LC-42", "Liofilización Placenta", "banco", "formats/FO-LC-42.html");
        upsertFormat("FO-LC-43", "Liofilización Medio Cond.", "banco", "formats/FO-LC-43.html");
        upsertFormat("FO-LC-44", "Lib. Micro Flasks/Viales", "calidad", "formats/FO-LC-44.html");
        upsertFormat("FO-LC-45", "Envío a Esterilización", "almacen", "formats/FO-LC-45.html");
        upsertFormat("FO-LC-50", "Manifiesto de Destrucción", "calidad", "formats/FO-LC-50.html");
        upsertFormat("FO-LC-51", "Registro de Desviaciones", "sgc", "formats/FO-LC-51.html");
        upsertFormat("FO-LC-TEST", "Formato de Prueba", "sgc", "formats/FO-LC-TEST.html");
        upsertFormat("FO-LC-12", "Dictamen Técnico de Concesión (FO-LC-12)", "almacen", "formats/FO-LC-12.html");
        upsertFormat("FO-OP-13", "Lista Verificación Recepción MP", "almacen", "formats/FO-OP-13.html");
        upsertFormat("FO-OP-15", "Pedido Maestro (Ventas)", "almacen", "formats/FO-OP-15.html");
        upsertFormat("FO-OP-16", "Orden de Surtido (Picking)", "almacen", "formats/FO-OP-16.html");
        upsertFormat("FO-OP-17", "Nota de Remisión", "almacen", "formats/FO-OP-17.html");
        upsertFormat("FO-OP-20", "Liberación a Almacén", "almacen", "formats/FO-OP-20.html");
        upsertFormat("FO-OP-52", "Reporte de MPNC", "almacen", "formats/FO-OP-52.html");
        upsertFormat("FO-OP-OP-01", "Formato Operativo OP-01", "almacen", "formats/FO-OP-OP-01.html");
    }

    private void upsertFormat(String code, String title, String area, String path) {
        FormatMetadataEntity entity = formatRepository.findByCodeIgnoreCase(code).orElseGet(FormatMetadataEntity::new);
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
