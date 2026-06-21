package com.inventory.demo.service;

import com.inventory.demo.dto.AdminOverviewResponse;
import com.inventory.demo.dto.InventoryEntryRequest;
import com.inventory.demo.dto.UpdateInventoryEntryRequest;
import com.inventory.demo.entity.InventoryEntry;
import com.inventory.demo.entity.Product;
import com.inventory.demo.factory.AdminOverviewFactory;
import com.inventory.demo.factory.InventoryEntryFactory;
import com.inventory.demo.repository.InventoryEntryRepository;
import com.inventory.demo.repository.ProductRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

    private final InventoryEntryRepository inventoryEntryRepository;
    private final ProductRepository productRepository;

    public InventoryService(InventoryEntryRepository inventoryEntryRepository,
                            ProductRepository productRepository) {
        this.inventoryEntryRepository = inventoryEntryRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public InventoryEntry saveDraft(InventoryEntryRequest request) {
        if (request.getQuantity() == null) {
            throw new IllegalArgumentException("Quantity is required");
        }

        Product product = findProduct(request.getProductId());
        Optional<InventoryEntry> existing = findExistingEntry(request);

        if (existing.isPresent() && existing.get().isSubmitted()) {
            throw new IllegalArgumentException("Product already submitted: " + request.getProductId());
        }

        InventoryEntry entry = InventoryEntryFactory.draft(existing, product, request);
        return inventoryEntryRepository.save(entry);
    }

    @Transactional
    public List<InventoryEntry> submitEntries(List<InventoryEntryRequest> requests) {
        List<InventoryEntry> entries = new ArrayList<>();
        for (InventoryEntryRequest request : requests) {
            if (request.getQuantity() == null) {
                continue;
            }
            Product product = findProduct(request.getProductId());
            Optional<InventoryEntry> existing = findExistingEntry(request);
            entries.add(InventoryEntryFactory.submitted(existing, product, request));
        }
        return inventoryEntryRepository.saveAll(entries);
    }

    @Transactional
    public InventoryEntry updateEntry(Long id, UpdateInventoryEntryRequest request) {
        InventoryEntry entry = inventoryEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Entry not found: " + id));
        if (request.getQuantity() == null) {
            throw new IllegalArgumentException("Quantity is required");
        }
        InventoryEntry updated = InventoryEntryFactory.withUpdatedQuantity(entry, request.getQuantity());
        return inventoryEntryRepository.save(updated);
    }

    public List<InventoryEntry> findAll() {
        return inventoryEntryRepository.findAll();
    }

    public AdminOverviewResponse getAdminOverview() {
        List<Product> allProducts = productRepository.findAllByOrderBySortOrderAsc();
        Map<String, List<Product>> productsByWorker = AdminOverviewFactory.groupProductsByWorker(allProducts);

        AdminOverviewResponse response = AdminOverviewResponse.builder().build();
        for (String worker : productRepository.findDistinctWorkers()) {
            List<Product> assignedProducts = productsByWorker.getOrDefault(worker, List.of());
            Map<Long, InventoryEntry> entriesByProductId = buildEntryMap(worker);
            response.getWorkers().add(
                    AdminOverviewFactory.workerStatus(worker, assignedProducts, entriesByProductId));
        }
        for (Product product : allProducts) {
            response.getProducts().add(AdminOverviewFactory.productAssignment(product));
        }
        return response;
    }

    @Transactional
    public void deleteAll() {
        inventoryEntryRepository.deleteAll();
    }

    @Transactional
    public void deleteById(Long id) {
        inventoryEntryRepository.deleteById(id);
    }

    public Map<Long, InventoryEntry> buildEntryMap(String worker) {
        Map<Long, InventoryEntry> entriesByProductId = new HashMap<>();
        for (InventoryEntry entry : inventoryEntryRepository.findByWorkerName(worker)) {
            if (entry.getProductId() != null) {
                entriesByProductId.put(entry.getProductId(), entry);
                continue;
            }
            productRepository.findAllByOrderBySortOrderAsc().stream()
                    .filter(product -> product.getName().equals(entry.getProductName()))
                    .findFirst()
                    .ifPresent(product -> entriesByProductId.putIfAbsent(product.getId(), entry));
        }
        return entriesByProductId;
    }

    private Product findProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
    }

    private Optional<InventoryEntry> findExistingEntry(InventoryEntryRequest request) {
        return inventoryEntryRepository.findByWorkerNameAndProductId(
                request.getWorkerName(), request.getProductId());
    }
}
