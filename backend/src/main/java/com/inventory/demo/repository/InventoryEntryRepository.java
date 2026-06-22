package com.inventory.demo.repository;

import com.inventory.demo.entity.InventoryEntry;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryEntryRepository extends JpaRepository<InventoryEntry, Long> {

    Optional<InventoryEntry> findByProductId(Long productId);

    List<InventoryEntry> findBySubmittedTrue();
}
