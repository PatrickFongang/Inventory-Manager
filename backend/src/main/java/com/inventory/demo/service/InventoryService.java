package com.inventory.demo.service;

import com.inventory.demo.dto.AdminOverviewResponse;
import com.inventory.demo.dto.InventoryEntryRequest;
import com.inventory.demo.dto.UpdateInventoryEntryRequest;
import com.inventory.demo.entity.InventoryEntry;
import com.inventory.demo.entity.Product;
import com.inventory.demo.entity.Section;
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
    private final SectionService sectionService;

    public InventoryService(InventoryEntryRepository inventoryEntryRepository,
                            ProductRepository productRepository,
                            SectionService sectionService) {
        this.inventoryEntryRepository = inventoryEntryRepository;
        this.productRepository = productRepository;
        this.sectionService = sectionService;
    }

    @Transactional
    public InventoryEntry saveDraft(InventoryEntryRequest request) {
        if (request.getQuantity() == null) {
            throw new IllegalArgumentException("Quantity is required");
        }
        Product product = findProduct(request.getProductId());
        Optional<InventoryEntry> existing = inventoryEntryRepository.findByProductId(product.getId());
        InventoryEntry entry = InventoryEntryFactory.draft(existing, product, request.getQuantity());
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
            Optional<InventoryEntry> existing = inventoryEntryRepository.findByProductId(product.getId());
            entries.add(InventoryEntryFactory.submitted(existing, product, request.getQuantity()));
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

    @Transactional
    public InventoryEntry adminSaveProduct(Long productId, UpdateInventoryEntryRequest request) {
        if (request.getQuantity() == null) {
            throw new IllegalArgumentException("Quantity is required");
        }
        Product product = findProduct(productId);
        Optional<InventoryEntry> existing = inventoryEntryRepository.findByProductId(product.getId());
        InventoryEntry entry = InventoryEntryFactory.submitted(existing, product, request.getQuantity());
        return inventoryEntryRepository.save(entry);
    }

    public List<InventoryEntry> findAll() {
        return inventoryEntryRepository.findAll();
    }

    public AdminOverviewResponse getAdminOverview() {
        List<Product> allProducts = productRepository.findAllByOrderBySortOrderAsc();
        Map<String, List<Product>> productsBySection = AdminOverviewFactory.groupProductsBySection(allProducts);
        Map<Long, InventoryEntry> entriesByProductId = buildEntryMap();

        AdminOverviewResponse response = AdminOverviewResponse.builder().build();
        for (Section section : sectionService.findAllOrderedWithWorkers()) {
            List<Product> sectionProducts = productsBySection.getOrDefault(section.getName(), List.of());
            response.getSections().add(
                    AdminOverviewFactory.sectionStatus(section, sectionProducts, entriesByProductId));
        }
        return response;
    }

    public List<AdminOverviewResponse.EditableProductView> getEditableProductsForSection(Long sectionId) {
        Section section = sectionService.findById(sectionId);
        Map<Long, InventoryEntry> entriesByProductId = buildEntryMap();
        return productRepository.findBySectionNameOrderBySortOrderAsc(section.getName()).stream()
                .map(product -> AdminOverviewFactory.editableProduct(
                        product, entriesByProductId.get(product.getId())))
                .toList();
    }

    @Transactional
    public void deleteAll() {
        inventoryEntryRepository.deleteAll();
    }

    @Transactional
    public void deleteById(Long id) {
        inventoryEntryRepository.deleteById(id);
    }

    public Map<Long, InventoryEntry> buildEntryMap() {
        Map<Long, InventoryEntry> entriesByProductId = new HashMap<>();
        for (InventoryEntry entry : inventoryEntryRepository.findAll()) {
            if (entry.getProductId() != null) {
                entriesByProductId.put(entry.getProductId(), entry);
            }
        }
        return entriesByProductId;
    }

    private Product findProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
    }
}
