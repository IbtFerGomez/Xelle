package com.xelle.backend.web;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xelle.backend.audit.AuditLogEntity;
import com.xelle.backend.audit.AuditLogRepository;
import com.xelle.backend.format.FormatMetadataEntity;
import com.xelle.backend.format.FormatMetadataRepository;
import com.xelle.backend.instance.FormatInstanceEntity;
import com.xelle.backend.instance.FormatInstanceRepository;
import com.xelle.backend.record.FormatRecordEntity;
import com.xelle.backend.record.FormatRecordRepository;
import com.xelle.backend.user.UserEntity;
import com.xelle.backend.user.UserRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final UserRepository userRepository;
    private final FormatMetadataRepository formatRepository;
    private final FormatRecordRepository recordRepository;
    private final FormatInstanceRepository instanceRepository;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public ApiController(
            UserRepository userRepository,
            FormatMetadataRepository formatRepository,
            FormatRecordRepository recordRepository,
            FormatInstanceRepository instanceRepository,
            AuditLogRepository auditLogRepository,
            ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.formatRepository = formatRepository;
        this.recordRepository = recordRepository;
        this.instanceRepository = instanceRepository;
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, Object> body) {
        String username = str(body.get("username"));
        String password = str(body.get("password"));

        Optional<UserEntity> userOpt = userRepository.findByUsernameIgnoreCase(username);
        if (userOpt.isEmpty()) {
            return Map.of("success", false, "msg", "Datos incorrectos");
        }

        UserEntity user = userOpt.get();
        if (!user.isActive()) {
            logAudit("LOGIN_FAILED", "AUTH", username, null, Map.of("reason", "inactive"));
            return Map.of("success", false, "msg", "Usuario inactivo");
        }

        if (!str(user.getPasswordHash()).equals(password)) {
            logAudit("LOGIN_FAILED", "AUTH", username, null, Map.of("reason", "bad_credentials"));
            return Map.of("success", false, "msg", "Datos incorrectos");
        }

        logAudit("LOGIN_SUCCESS", "AUTH", username, user.getId(), Map.of("role", defaultIfBlank(user.getRole(), "")));

        return Map.of("success", true, "user", mapUserSession(user));
    }

    @GetMapping("/users")
    public ResponseEntity<?> users(@RequestParam(name = "actor_user_id", required = false) Long actorUserId) {
        if (!isAdminUser(actorUserId)) {
            return forbiddenAdmin();
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (UserEntity user : userRepository.findAll()) {
            out.add(mapUser(user));
        }
        return ResponseEntity.ok(out);
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> body) {
        Long actorUserId = asLong(body.get("actor_user_id"));
        if (!isAdminUser(actorUserId)) {
            return forbiddenAdmin();
        }

        String username = str(body.get("username"));
        if (username.isBlank() || userRepository.findByUsernameIgnoreCase(username).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("msg", "Usuario existente o inválido"));
        }

        UserEntity user = new UserEntity();
        applyUserPayload(user, body, true);
        userRepository.save(user);
        logAudit("USER_CREATE", "USER", defaultIfBlank(user.getUsername(), ""), actorUserId,
                Map.of("target_user_id", user.getId()));
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @SuppressWarnings("null")
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long actorUserId = asLong(body.get("actor_user_id"));
        if (!isAdminUser(actorUserId)) {
            return forbiddenAdmin();
        }

        Optional<UserEntity> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        UserEntity user = userOpt.get();
        applyUserPayload(user, body, false);
        userRepository.save(user);
        logAudit("USER_UPDATE", "USER", defaultIfBlank(user.getUsername(), ""), actorUserId,
                Map.of("target_user_id", user.getId()));
        return ResponseEntity.ok(Map.of("status", "updated"));
    }

    @SuppressWarnings("null")
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> toggleUser(@PathVariable Long id,
            @RequestParam(name = "actor_user_id", required = false) Long actorUserId) {
        if (!isAdminUser(actorUserId)) {
            return forbiddenAdmin();
        }

        Optional<UserEntity> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        UserEntity user = userOpt.get();
        user.setActive(!user.isActive());
        userRepository.save(user);
        logAudit("USER_TOGGLE", "USER", defaultIfBlank(user.getUsername(), ""), actorUserId,
                Map.of("target_user_id", user.getId(), "active", user.isActive()));
        return ResponseEntity.ok(Map.of("status", "toggled"));
    }

    @SuppressWarnings("null")
    @DeleteMapping("/users/{id}/permanent")
    public ResponseEntity<?> deleteUser(@PathVariable Long id,
            @RequestParam(name = "actor_user_id", required = false) Long actorUserId) {
        if (!isAdminUser(actorUserId)) {
            return forbiddenAdmin();
        }

        Optional<UserEntity> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        UserEntity user = userOpt.get();
        if ("Xelle_Fer".equalsIgnoreCase(defaultIfBlank(user.getUsername(), ""))) {
            return ResponseEntity.badRequest().body(Map.of("msg", "No se puede eliminar el usuario base del sistema"));
        }
        userRepository.delete(user);
        logAudit("USER_DELETE", "USER", defaultIfBlank(user.getUsername(), ""), actorUserId,
                Map.of("target_user_id", user.getId()));
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    @GetMapping("/formats")
    public List<Map<String, Object>> formats() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (FormatMetadataEntity format : formatRepository.findByActiveTrueOrderByCodeAsc()) {
            out.add(mapFormat(format));
        }
        return out;
    }

    @GetMapping("/formats_admin")
    public ResponseEntity<?> formatsAdmin(@RequestParam(name = "actor_user_id", required = false) Long actorUserId) {
        if (!isAdminUser(actorUserId)) {
            return forbiddenAdmin();
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (FormatMetadataEntity format : formatRepository.findAllByOrderByCodeAsc()) {
            out.add(mapFormat(format));
        }
        return ResponseEntity.ok(out);
    }

    @PostMapping("/formats")
    public ResponseEntity<?> createFormat(@RequestBody Map<String, Object> body) {
        Long actorUserId = asLong(body.get("actor_user_id"));
        if (!isAdminUser(actorUserId)) {
            return forbiddenAdmin();
        }

        String code = str(body.get("code"));
        String title = str(body.get("title"));
        String area = str(body.get("area"));
        String filePath = str(body.get("file_path"));
        if (code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("msg", "code requerido"));
        }
        if (title.isBlank() || area.isBlank() || filePath.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("msg", "title, area y file_path son requeridos"));
        }
        if (formatRepository.findByCodeIgnoreCase(code).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("msg", "Formato existente"));
        }
        FormatMetadataEntity format = new FormatMetadataEntity();
        applyFormatPayload(format, body, true);
        formatRepository.save(format);
        logAudit("FORMAT_CREATE", "FORMAT", defaultIfBlank(format.getCode(), ""), actorUserId,
                Map.of("format_id", format.getId(), "file_path", defaultIfBlank(format.getFilePath(), "")));
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @SuppressWarnings("null")
    @PutMapping("/formats/{id}")
    public ResponseEntity<?> updateFormat(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long actorUserId = asLong(body.get("actor_user_id"));
        if (!isAdminUser(actorUserId)) {
            return forbiddenAdmin();
        }

        Optional<FormatMetadataEntity> opt = formatRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        String code = str(body.get("code"));
        String title = str(body.get("title"));
        String area = str(body.get("area"));
        String filePath = str(body.get("file_path"));
        if (code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("msg", "code requerido"));
        }
        if (title.isBlank() || area.isBlank() || filePath.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("msg", "title, area y file_path son requeridos"));
        }
        Optional<FormatMetadataEntity> duplicate = formatRepository.findByCodeIgnoreCase(code);
        if (duplicate.isPresent() && !duplicate.get().getId().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("msg", "Formato existente"));
        }

        FormatMetadataEntity format = opt.get();
        applyFormatPayload(format, body, false);
        formatRepository.save(format);
        logAudit("FORMAT_UPDATE", "FORMAT", defaultIfBlank(format.getCode(), ""), actorUserId,
                Map.of("format_id", format.getId(), "file_path", defaultIfBlank(format.getFilePath(), "")));
        return ResponseEntity.ok(Map.of("status", "updated"));
    }

    @SuppressWarnings("null")
    @DeleteMapping("/formats/{id}")
    public ResponseEntity<?> toggleFormat(@PathVariable Long id,
            @RequestParam(name = "actor_user_id", required = false) Long actorUserId) {
        if (!isAdminUser(actorUserId)) {
            return forbiddenAdmin();
        }

        Optional<FormatMetadataEntity> opt = formatRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        FormatMetadataEntity format = opt.get();
        format.setActive(!format.isActive());
        formatRepository.save(format);
        logAudit("FORMAT_TOGGLE", "FORMAT", defaultIfBlank(format.getCode(), ""), actorUserId,
                Map.of("format_id", format.getId(), "active", format.isActive()));
        return ResponseEntity.ok(Map.of("status", "toggled"));
    }

    @SuppressWarnings("null")
    @DeleteMapping("/formats/{id}/permanent")
    public ResponseEntity<?> deleteFormat(@PathVariable Long id,
            @RequestParam(name = "actor_user_id", required = false) Long actorUserId) {
        if (!isAdminUser(actorUserId)) {
            return forbiddenAdmin();
        }

        Optional<FormatMetadataEntity> opt = formatRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        FormatMetadataEntity format = opt.get();
        formatRepository.delete(opt.get());
        logAudit("FORMAT_DELETE", "FORMAT", defaultIfBlank(format.getCode(), ""), actorUserId,
                Map.of("format_id", format.getId()));
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    @GetMapping("/history")
    public ResponseEntity<?> history(@RequestParam(name = "actor_user_id", required = false) Long actorUserId) {
        if (!isAdminUser(actorUserId)) {
            return forbiddenAdmin();
        }

        List<Map<String, Object>> out = new ArrayList<>();
        for (AuditLogEntity log : auditLogRepository.findTop500ByOrderByCreatedAtDesc()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", log.getId());
            item.put("action", defaultIfBlank(log.getAction(), ""));
            item.put("entity_type", defaultIfBlank(log.getEntityType(), ""));
            item.put("entity_key", defaultIfBlank(log.getEntityKey(), ""));
            item.put("user_id", log.getUserId());
            item.put("username", defaultIfBlank(log.getUsername(), ""));
            item.put("updated_at", log.getCreatedAt() != null ? log.getCreatedAt().toString() : null);
            item.put("details", parseObject(log.getDetails()));
            item.put("record_key", defaultIfBlank(log.getEntityKey(), ""));
            item.put("format_code", "FORMAT_INSTANCE".equalsIgnoreCase(defaultIfBlank(log.getEntityType(), ""))
                    ? defaultIfBlank(log.getEntityKey(), "")
                    : defaultIfBlank(log.getEntityType(), ""));
            out.add(item);
        }
        return ResponseEntity.ok(out);
    }

    @PostMapping("/formats/generate-unique-code")
    public ResponseEntity<?> generateCode(@RequestBody Map<String, Object> body) {
        String formatType = str(body.get("format_type"));
        if (formatType.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("msg", "format_type requerido"));
        }
        String code = nextUniqueCode(formatType);
        return ResponseEntity.ok(Map.of("unique_code", code, "barcode_text", code));
    }

    @PostMapping("/format-instances")
    public ResponseEntity<?> createFormatInstance(@RequestBody Map<String, Object> body) {
        String uniqueCode = str(body.get("unique_code"));
        String formatType = str(body.get("format_type"));

        if (uniqueCode.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("msg", "Debe indicar código único de barras"));
        }
        if (formatType.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("msg", "format_type requerido"));
        }
        if (instanceRepository.findByUniqueCode(uniqueCode).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("msg", "Código único ya existe"));
        }

        FormatInstanceEntity instance = new FormatInstanceEntity();
        instance.setUniqueCode(uniqueCode);
        instance.setFormatType(formatType);
        instance.setStatus(defaultIfBlank(str(body.get("status")), "DRAFT"));
        instance.setDataPayload(toJson(body.get("data_payload")));
        instance.setCreatedBy(asLong(body.get("user_id")));
        instance.setUpdatedBy(asLong(body.get("user_id")));
        instance.setNotes(str(body.get("notes")));
        instance.setCreatedAt(OffsetDateTime.now());
        instance.setUpdatedAt(OffsetDateTime.now());

        instanceRepository.save(instance);
        upsertRecord(instance);
        logAudit("INSTANCE_CREATE", "FORMAT_INSTANCE", defaultIfBlank(instance.getUniqueCode(), ""),
                instance.getCreatedBy(), Map.of("format_type", defaultIfBlank(instance.getFormatType(), "")));

        return ResponseEntity.ok(Map.of(
                "success", true,
                "unique_code", instance.getUniqueCode(),
                "format_type", instance.getFormatType(),
                "status", instance.getStatus(),
                "created_at", instance.getCreatedAt().toString()));
    }

    @GetMapping("/format-instances/{uniqueCode}")
    public ResponseEntity<?> getFormatInstance(@PathVariable String uniqueCode) {
        Optional<FormatInstanceEntity> opt = instanceRepository.findByUniqueCode(uniqueCode);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", "Formato no encontrado"));
        }
        return ResponseEntity.ok(mapInstance(opt.get()));
    }

    @GetMapping("/format-instances")
    public List<Map<String, Object>> listFormatInstances() {
        Map<String, String> formatPaths = formatRepository.findAllByOrderByCodeAsc()
                .stream()
                .collect(Collectors.toMap(
                        format -> defaultIfBlank(format.getCode(), ""),
                        format -> defaultIfBlank(format.getFilePath(), ""),
                        (first, second) -> first));

        List<Map<String, Object>> out = new ArrayList<>();
        for (FormatInstanceEntity instance : instanceRepository.findTop500ByOrderByUpdatedAtDesc()) {
            Map<String, Object> item = new HashMap<>();
            String formatType = defaultIfBlank(instance.getFormatType(), "");
            item.put("unique_code", defaultIfBlank(instance.getUniqueCode(), ""));
            item.put("format_type", formatType);
            item.put("status", defaultIfBlank(instance.getStatus(), ""));
            item.put("created_by", instance.getCreatedBy());
            item.put("updated_by", instance.getUpdatedBy());
            item.put("created_at", instance.getCreatedAt() != null ? instance.getCreatedAt().toString() : null);
            item.put("updated_at", instance.getUpdatedAt() != null ? instance.getUpdatedAt().toString() : null);
            item.put("file_path", formatPaths.getOrDefault(formatType, ""));
            out.add(item);
        }
        return out;
    }

    @PutMapping("/format-instances/{uniqueCode}")
    public ResponseEntity<?> updateFormatInstance(@PathVariable String uniqueCode,
            @RequestBody Map<String, Object> body) {
        Optional<FormatInstanceEntity> opt = instanceRepository.findByUniqueCode(uniqueCode);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", "Formato no encontrado"));
        }

        FormatInstanceEntity instance = opt.get();
        if (body.containsKey("status")) {
            instance.setStatus(defaultIfBlank(str(body.get("status")), instance.getStatus()));
        }
        if (body.containsKey("notes")) {
            instance.setNotes(str(body.get("notes")));
        }
        if (body.containsKey("data_payload")) {
            instance.setDataPayload(toJson(body.get("data_payload")));
        }
        Long userId = asLong(body.get("user_id"));
        if (userId != null) {
            instance.setUpdatedBy(userId);
        }
        instance.setUpdatedAt(OffsetDateTime.now());
        instanceRepository.save(instance);
        upsertRecord(instance);
        logAudit("INSTANCE_UPDATE", "FORMAT_INSTANCE", defaultIfBlank(instance.getUniqueCode(), ""),
                instance.getUpdatedBy(), Map.of("status", defaultIfBlank(instance.getStatus(), "")));

        return ResponseEntity
                .ok(Map.of("success", true, "unique_code", instance.getUniqueCode(), "status", instance.getStatus()));
    }

    @SuppressWarnings("null")
    @DeleteMapping("/format-instances/{uniqueCode}")
    public ResponseEntity<?> deleteFormatInstance(@PathVariable String uniqueCode,
            @RequestParam(name = "actor_user_id", required = false) Long actorUserId) {
        if (!isAdminUser(actorUserId)) {
            return forbiddenAdmin();
        }

        Optional<FormatInstanceEntity> opt = instanceRepository.findByUniqueCode(uniqueCode);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", "Formato no encontrado"));
        }
        logAudit("INSTANCE_DELETE", "FORMAT_INSTANCE", defaultIfBlank(uniqueCode, ""), actorUserId, Map.of());
        instanceRepository.delete(opt.get());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/format-instances/stats/overview")
    public Map<String, Object> statsOverview() {
        Map<String, Object> out = new HashMap<>();
        out.put("total", instanceRepository.count());
        out.put("draft", instanceRepository.countByStatusIgnoreCase("DRAFT"));
        out.put("completed", instanceRepository.countByStatusIgnoreCase("COMPLETED"));
        return out;
    }

    private String nextUniqueCode(String formatType) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        OffsetDateTime from = today.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime to = from.plusDays(1).minusNanos(1);

        long count = instanceRepository.countByFormatTypeAndCreatedAtBetween(formatType, from, to);
        long seq = count + 1;
        String datePart = today.format(DateTimeFormatter.BASIC_ISO_DATE);

        String candidate = formatType + "-" + datePart + "-" + String.format("%03d", seq);
        while (instanceRepository.findByUniqueCode(candidate).isPresent()) {
            seq += 1;
            candidate = formatType + "-" + datePart + "-" + String.format("%03d", seq);
        }
        return candidate;
    }

    private void upsertRecord(FormatInstanceEntity instance) {
        FormatRecordEntity rec = recordRepository.findByRecordKey(instance.getUniqueCode())
                .orElseGet(FormatRecordEntity::new);
        rec.setFormatCode(instance.getFormatType());
        rec.setRecordKey(instance.getUniqueCode());
        rec.setDataPayload(instance.getDataPayload());
        rec.setUserId(instance.getUpdatedBy() != null ? instance.getUpdatedBy() : instance.getCreatedBy());
        if (rec.getCreatedAt() == null) {
            rec.setCreatedAt(OffsetDateTime.now());
        }
        rec.setUpdatedAt(OffsetDateTime.now());
        recordRepository.save(rec);
    }

    private void applyUserPayload(UserEntity user, Map<String, Object> body, boolean creating) {
        String username = str(body.get("username"));
        if (creating) {
            user.setUsername(username);
        }
        if (body.containsKey("fullName")) {
            user.setFullName(str(body.get("fullName")));
        }
        if (body.containsKey("role")) {
            user.setRole(str(body.get("role")));
        }
        if (body.containsKey("moduleAccess")) {
            user.setModuleAccess(toJson(body.get("moduleAccess")));
        }
        if (body.containsKey("active")) {
            user.setActive(Boolean.TRUE.equals(body.get("active")));
        }
        String pass = str(body.get("password"));
        if (creating || !pass.isBlank()) {
            user.setPasswordHash(pass.isBlank() ? "123" : pass);
        }
        if (user.getModuleAccess() == null || user.getModuleAccess().isBlank()) {
            user.setModuleAccess("[]");
        }
    }

    private void applyFormatPayload(FormatMetadataEntity format, Map<String, Object> body, boolean creating) {
        if (creating || body.containsKey("code")) {
            format.setCode(str(body.get("code")));
        }
        if (body.containsKey("title")) {
            format.setTitle(str(body.get("title")));
        }
        if (body.containsKey("area")) {
            format.setArea(str(body.get("area")));
        }
        if (body.containsKey("file_path")) {
            format.setFilePath(str(body.get("file_path")));
        }
        if (creating) {
            format.setActive(true);
        }
    }

    private Map<String, Object> mapUser(UserEntity user) {
        return Map.of(
                "id", user.getId(),
                "username", defaultIfBlank(user.getUsername(), ""),
                "full_name", defaultIfBlank(user.getFullName(), ""),
                "role", defaultIfBlank(user.getRole(), ""),
                "module_access", parseAccess(user.getModuleAccess()),
                "active", user.isActive());
    }

    private Map<String, Object> mapUserSession(UserEntity user) {
        List<String> access = parseAccess(user.getModuleAccess());
        return Map.of(
                "id", user.getId(),
                "username", defaultIfBlank(user.getUsername(), ""),
                "fullName", defaultIfBlank(user.getFullName(), ""),
                "role", defaultIfBlank(user.getRole(), ""),
                "moduleAccess", access,
                "access", access);
    }

    private List<String> parseAccess(String json) {
        try {
            if (json == null || json.isBlank()) {
                return List.of();
            }
            return objectMapper.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (Exception ex) {
            return List.of();
        }
    }

    private Map<String, Object> mapFormat(FormatMetadataEntity format) {
        return Map.of(
                "id", format.getId(),
                "code", defaultIfBlank(format.getCode(), ""),
                "title", defaultIfBlank(format.getTitle(), ""),
                "area", defaultIfBlank(format.getArea(), ""),
                "file_path", defaultIfBlank(format.getFilePath(), ""),
                "active", format.isActive());
    }

    private Map<String, Object> mapInstance(FormatInstanceEntity instance) {
        Map<String, Object> out = new HashMap<>();
        out.put("unique_code", instance.getUniqueCode());
        out.put("format_type", instance.getFormatType());
        out.put("status", instance.getStatus());
        out.put("data_payload", parseObject(instance.getDataPayload()));
        out.put("created_by", instance.getCreatedBy());
        out.put("created_at", instance.getCreatedAt() != null ? instance.getCreatedAt().toString() : null);
        out.put("updated_at", instance.getUpdatedAt() != null ? instance.getUpdatedAt().toString() : null);
        out.put("notes", instance.getNotes());
        return out;
    }

    private Object parseObject(String json) {
        try {
            if (json == null || json.isBlank()) {
                return Map.of();
            }
            return objectMapper.readValue(json, Object.class);
        } catch (Exception ex) {
            return Map.of();
        }
    }

    private String toJson(Object obj) {
        try {
            if (obj == null) {
                return "{}";
            }
            return objectMapper.writeValueAsString(obj);
        } catch (Exception ex) {
            return "{}";
        }
    }

    private String str(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private Long asLong(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Long.valueOf(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private boolean isAdminUser(Long actorUserId) {
        if (actorUserId == null) {
            return false;
        }
        Optional<UserEntity> actor = userRepository.findById(actorUserId);
        if (actor.isEmpty()) {
            return false;
        }
        UserEntity user = actor.get();
        if (!user.isActive()) {
            return false;
        }
        String role = defaultIfBlank(user.getRole(), "").toLowerCase();
        return role.contains("admin");
    }

    private ResponseEntity<Map<String, Object>> forbiddenAdmin() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("msg", "Operación permitida solo para administrador"));
    }

    private void logAudit(String action, String entityType, String entityKey, Long userId,
            Map<String, Object> details) {
        AuditLogEntity log = new AuditLogEntity();
        log.setAction(defaultIfBlank(action, "UNKNOWN"));
        log.setEntityType(defaultIfBlank(entityType, "SYSTEM"));
        log.setEntityKey(defaultIfBlank(entityKey, "N/A"));
        log.setUserId(userId);
        String username = "";
        if (userId != null) {
            username = userRepository.findById(userId).map(UserEntity::getUsername).orElse("");
        }
        log.setUsername(defaultIfBlank(username, "system"));
        log.setDetails(toJson(details));
        log.setCreatedAt(OffsetDateTime.now());
        auditLogRepository.save(log);
    }
}
