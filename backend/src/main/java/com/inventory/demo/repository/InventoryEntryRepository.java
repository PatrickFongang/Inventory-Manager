package com.inventory.demo.repository;

import com.inventory.demo.entity.InventoryEntry;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface InventoryEntryRepository extends JpaRepository<InventoryEntry, Long> {

    @Query("SELECT e.productName, SUM(e.quantity) FROM InventoryEntry e WHERE e.submitted = true GROUP BY e.productName")
    List<Object[]> sumQuantitiesByProduct();

    List<InventoryEntry> findByWorkerName(String workerName);

    Optional<InventoryEntry> findByWorkerNameAndProductId(String workerName, Long productId);
}
