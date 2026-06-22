package com.inventory.demo.repository;

import com.inventory.demo.entity.Section;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SectionRepository extends JpaRepository<Section, Long> {

    List<Section> findAllByOrderBySortOrderAsc();

    @Query("SELECT DISTINCT s FROM Section s LEFT JOIN FETCH s.workers ORDER BY s.sortOrder ASC")
    List<Section> findAllWithWorkersOrderBySortOrderAsc();

    @Query("SELECT DISTINCT s FROM Section s JOIN s.workers w WHERE w.id = :workerId ORDER BY s.sortOrder ASC")
    List<Section> findByWorkerIdOrderBySortOrderAsc(@Param("workerId") Long workerId);
}
