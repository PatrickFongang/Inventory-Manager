package com.inventory.demo.repository;

import com.inventory.demo.entity.InventoryEntry;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface InventoryEntryRepository extends JpaRepository<InventoryEntry, Long> {

    @Query("SELECT e.productName, SUM(e.quantity) FROM InventoryEntry e GROUP BY e.productName")
    List<Object[]> sumQuantitiesByProduct();
}
