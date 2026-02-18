package com.xelle.backend.web;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final UserRepository userRepository;
    private final FormatMetadataRepository formatRepository;
    private final FormatRecordRepository recordRepository;
    private final FormatInstanceRepository instanceRepository;
    private final ObjectMapper objectMapper;

    public ApiController(
        UserRepository userRepository,
        FormatMetadataRepository formatRepository,
        FormatRecordRepository recordRepository,
        FormatInstanceRepository instanceRepository,
        ObjectMapper objectMapper
    ) {
        this.userRepository = userRepository;
        this.formatRepository = formatRepository;
        this.recordRepository = recordRepository;
        this.instanceRepository = instanceRepository;
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
            return Map.of("success", false, "msg", "Usuario inactivo");
        }

        if (!str(user.getPasswordHash()).equals(password)) {
            return Map.of("success", false, "msg", "Datos incorrectos");
        }

        return Map.of("success", true, "user", mapUserSession(user));
    }

    @GetMapping("/users")
    public List<Map<String, Object>> users() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (UserEntity user : userRepository.findAll()) {
            out.add(mapUser(user));
        }
        return out;
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> body) {
        String username = str(body.get("username"));
        if (username.isBlank() || userRepository.findByUsernameIgnoreCase(username).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("msg", "Usuario existente o inválido"));
        }

        UserEntity user = new UserEntity();
        applyUserPayload(user, body, true);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<UserEntity> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        UserEntity user = userOpt.get();
        applyUserPayload(user, body, false);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("status", "updated"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> toggleUser(@PathVariable Long id) {
        Optional<UserEntity> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        UserEntity user = userOpt.get();
        user.setActive(!user.isActive());
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("status", "toggled"));
    }

    @DeleteMapping("/users/{id}/permanent")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        Optional<UserEntity> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        UserEntity user = userOpt.get();
        if ("Xelle_Fer".equalsIgnoreCase(defaultIfBlank(user.getUsername(), ""))) {
            return ResponseEntity.badRequest().body(Map.of("msg", "No se puede eliminar el usuario base del sistema"));
        }
        userRepository.delete(user);
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
    public List<Map<String, Object>> formatsAdmin() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (FormatMetadataEntity format : formatRepository.findAllByOrderByCodeAsc()) {
            out.add(mapFormat(format));
        }
        return out;
    }

    @PostMapping("/formats")
    public ResponseEntity<?> createFormat(@RequestBody Map<String, Object> body) {
        String code = str(body.get("code"));
        if (code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("msg", "code requerido"));
        }
        if (formatRepository.findByCodeIgnoreCase(code).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("msg", "Formato existente"));
        }
        FormatMetadataEntity format = new FormatMetadataEntity();
        applyFormatPayload(format, body, true);
        formatRepository.save(format);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PutMapping("/formats/{id}")
    public ResponseEntity<?> updateFormat(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<FormatMetadataEntity> opt = formatRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        FormatMetadataEntity format = opt.get();
        applyFormatPayload(format, body, false);
        formatRepository.save(format);
        return ResponseEntity.ok(Map.of("status", "updated"));
    }

    @DeleteMapping("/formats/{id}")
    public ResponseEntity<?> toggleFormat(@PathVariable Long id) {
        Optional<FormatMetadataEntity> opt = formatRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        FormatMetadataEntity format = opt.get();
        format.setActive(!format.isActive());
        formatRepository.save(format);
        return ResponseEntity.ok(Map.of("status", "toggled"));
    }

    @DeleteMapping("/formats/{id}/permanent")
    public ResponseEntity<?> deleteFormat(@PathVariable Long id) {
        Optional<FormatMetadataEntity> opt = formatRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        formatRepository.delete(opt.get());
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    @GetMapping("/history")
    public List<Map<String, Object>> history() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (FormatRecordEntity rec : recordRepository.findTop200ByOrderByUpdatedAtDesc()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", rec.getId());
            item.put("format_code", rec.getFormatCode());
            item.put("record_key", rec.getRecordKey());
            item.put("user_id", rec.getUserId());
            item.put("updated_at", rec.getUpdatedAt() != null ? rec.getUpdatedAt().toString() : null);
            out.add(item);
        }
        return out;
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

        return ResponseEntity.ok(Map.of(
            "success", true,
            "unique_code", instance.getUniqueCode(),
            "format_type", instance.getFormatType(),
            "status", instance.getStatus(),
            "created_at", instance.getCreatedAt().toString()
        ));
    }

    @GetMapping("/format-instances/{uniqueCode}")
    public ResponseEntity<?> getFormatInstance(@PathVariable String uniqueCode) {
        Optional<FormatInstanceEntity> opt = instanceRepository.findByUniqueCode(uniqueCode);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", "Formato no encontrado"));
        }
        return ResponseEntity.ok(mapInstance(opt.get()));
    }

    @PutMapping("/format-instances/{uniqueCode}")
    public ResponseEntity<?> updateFormatInstance(@PathVariable String uniqueCode, @RequestBody Map<String, Object> body) {
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

        return ResponseEntity.ok(Map.of("success", true, "unique_code", instance.getUniqueCode(), "status", instance.getStatus()));
    }

    @DeleteMapping("/format-instances/{uniqueCode}")
    public ResponseEntity<?> deleteFormatInstance(@PathVariable String uniqueCode) {
        Optional<FormatInstanceEntity> opt = instanceRepository.findByUniqueCode(uniqueCode);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", "Formato no encontrado"));
        }
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
        FormatRecordEntity rec = recordRepository.findByRecordKey(instance.getUniqueCode()).orElseGet(FormatRecordEntity::new);
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
        if (creating) {
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
            "active", user.isActive()
        );
    }

    private Map<String, Object> mapUserSession(UserEntity user) {
        return Map.of(
            "id", user.getId(),
            "username", defaultIfBlank(user.getUsername(), ""),
            "fullName", defaultIfBlank(user.getFullName(), ""),
            "role", defaultIfBlank(user.getRole(), ""),
            "moduleAccess", parseAccess(user.getModuleAccess())
        );
    }

    private List<String> parseAccess(String json) {
        try {
            if (json == null || json.isBlank()) {
                return List.of();
            }
            return objectMapper.readValue(json, new TypeReference<List<String>>() { });
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
            "active", format.isActive()
        );
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
}
