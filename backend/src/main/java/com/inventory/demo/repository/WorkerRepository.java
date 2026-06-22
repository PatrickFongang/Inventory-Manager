package com.inventory.demo.repository;

import com.inventory.demo.entity.Worker;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkerRepository extends JpaRepository<Worker, Long> {

    List<Worker> findAllByOrderByLastNameAscFirstNameAsc();

    Optional<Worker> findByFirstNameIgnoreCaseAndLastNameIgnoreCase(String firstName, String lastName);

    @Query("""
            SELECT w FROM Worker w
            WHERE LOWER(w.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(w.lastName) LIKE LOWER(CONCAT('%', :search, '%'))
            ORDER BY w.lastName ASC, w.firstName ASC
            """)
    List<Worker> searchByName(@Param("search") String search);

    @Modifying
    @Query("UPDATE Worker w SET w.workingToday = false")
    void resetAllWorkingToday();
}
