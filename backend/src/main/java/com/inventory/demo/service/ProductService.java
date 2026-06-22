package com.inventory.demo.service;

import com.inventory.demo.dto.WorkerProductView;
import com.inventory.demo.entity.InventoryEntry;
import com.inventory.demo.entity.Product;
import com.inventory.demo.entity.Section;
import com.inventory.demo.factory.WorkerProductViewFactory;
import com.inventory.demo.repository.ProductRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final SectionService sectionService;
    private final InventoryService inventoryService;

    public ProductService(ProductRepository productRepository,
                          SectionService sectionService,
                          InventoryService inventoryService) {
        this.productRepository = productRepository;
        this.sectionService = sectionService;
        this.inventoryService = inventoryService;
    }

    public List<WorkerProductView> getProductsForWorkerWithStatus(Long workerId, Boolean pendingOnly) {
        List<String> sectionNames = sectionService.findSectionsForWorker(workerId).stream()
                .map(Section::getName)
                .toList();

        if (sectionNames.isEmpty()) {
            return List.of();
        }

        List<Product> products = productRepository.findBySectionNameInOrderBySortOrderAsc(sectionNames);
        Map<Long, InventoryEntry> entriesByProductId = inventoryService.buildEntryMap();

        return products.stream()
                .map(product -> WorkerProductViewFactory.fromProduct(
                        product, entriesByProductId.get(product.getId())))
                .filter(view -> pendingOnly == null || !pendingOnly || !view.isSubmitted())
                .collect(Collectors.toList());
    }
}
