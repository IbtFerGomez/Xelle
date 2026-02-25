package com.xelle.backend.record;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FormatRecordRepository extends JpaRepository<FormatRecordEntity, Long> {
    List<FormatRecordEntity> findTop200ByOrderByUpdatedAtDesc();

    List<FormatRecordEntity> findByFormatCodeIgnoreCase(String formatCode);

    Optional<FormatRecordEntity> findByRecordKey(String recordKey);
}
