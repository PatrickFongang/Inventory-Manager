package com.inventory.demo.service;

import com.inventory.demo.entity.Product;
import com.inventory.demo.repository.ProductRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<String> getWorkers() {
        return productRepository.findDistinctWorkers();
    }

    public List<Product> getProductsForWorker(String worker) {
        return productRepository.findByAssignedWorkerOrderBySortOrderAsc(worker);
    }
}
