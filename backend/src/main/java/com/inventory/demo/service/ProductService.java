package com.inventory.demo.service;

import com.inventory.demo.dto.WorkerProductView;
import com.inventory.demo.entity.InventoryEntry;
import com.inventory.demo.entity.Product;
import com.inventory.demo.factory.WorkerProductViewFactory;
import com.inventory.demo.repository.ProductRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final InventoryService inventoryService;

    public ProductService(ProductRepository productRepository,
                          InventoryService inventoryService) {
        this.productRepository = productRepository;
        this.inventoryService = inventoryService;
    }

    public List<String> getWorkers() {
        return productRepository.findDistinctWorkers();
    }

    public List<Product> getProductsForWorker(String worker) {
        return productRepository.findByAssignedWorkerOrderBySortOrderAsc(worker);
    }

    public List<WorkerProductView> getProductsForWorkerWithStatus(String worker, Boolean pendingOnly) {
        List<Product> products = productRepository.findByAssignedWorkerOrderBySortOrderAsc(worker);
        Map<Long, InventoryEntry> entriesByProductId = inventoryService.buildEntryMap(worker);

        return products.stream()
                .map(product -> WorkerProductViewFactory.fromProduct(
                        product, entriesByProductId.get(product.getId())))
                .filter(view -> pendingOnly == null || !pendingOnly || !view.isSubmitted())
                .collect(Collectors.toList());
    }

    public Product updateAssignment(Long productId, String assignedWorker) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
        product.setAssignedWorker(assignedWorker);
        return productRepository.save(product);
    }
}
