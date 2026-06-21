package com.inventory.demo.repository;

import com.inventory.demo.entity.Product;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByAssignedWorkerOrderBySortOrderAsc(String assignedWorker);

    List<Product> findAllByOrderBySortOrderAsc();

    @Query("SELECT DISTINCT p.assignedWorker FROM Product p ORDER BY p.assignedWorker ASC")
    List<String> findDistinctWorkers();
}
