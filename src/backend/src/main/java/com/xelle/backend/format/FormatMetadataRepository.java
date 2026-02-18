package com.xelle.backend.format;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FormatMetadataRepository extends JpaRepository<FormatMetadataEntity, Long> {
    List<FormatMetadataEntity> findByActiveTrueOrderByCodeAsc();
    List<FormatMetadataEntity> findAllByOrderByCodeAsc();
    Optional<FormatMetadataEntity> findByCodeIgnoreCase(String code);
}
