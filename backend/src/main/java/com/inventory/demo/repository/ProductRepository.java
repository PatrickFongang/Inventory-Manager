package com.inventory.demo.repository;

import com.inventory.demo.entity.Product;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findAllByOrderBySortOrderAsc();

    List<Product> findBySectionNameInOrderBySortOrderAsc(Collection<String> sectionNames);

    List<Product> findBySectionNameOrderBySortOrderAsc(String sectionName);
}
