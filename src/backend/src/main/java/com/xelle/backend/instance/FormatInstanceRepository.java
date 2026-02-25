package com.xelle.backend.instance;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FormatInstanceRepository extends JpaRepository<FormatInstanceEntity, Long> {
    Optional<FormatInstanceEntity> findByUniqueCode(String uniqueCode);

    List<FormatInstanceEntity> findByFormatTypeIgnoreCase(String formatType);

    List<FormatInstanceEntity> findTop500ByOrderByUpdatedAtDesc();

    long countByFormatTypeAndCreatedAtBetween(String formatType, OffsetDateTime from, OffsetDateTime to);

    long countByStatusIgnoreCase(String status);
}
