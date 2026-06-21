package com.inventory.demo.service;

import com.inventory.demo.dto.InventoryEntryRequest;
import com.inventory.demo.entity.InventoryEntry;
import com.inventory.demo.entity.Product;
import com.inventory.demo.repository.InventoryEntryRepository;
import com.inventory.demo.repository.ProductRepository;
import java.util.ArrayList;
import java.util.List;
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
    public List<InventoryEntry> saveEntries(List<InventoryEntryRequest> requests) {
        List<InventoryEntry> entries = new ArrayList<>();
        for (InventoryEntryRequest request : requests) {
            if (request.getQuantity() == null) {
                continue;
            }
            Product product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Product not found: " + request.getProductId()));

            InventoryEntry entry = new InventoryEntry();
            entry.setProductName(product.getName());
            entry.setWorkerName(request.getWorkerName());
            entry.setQuantity(request.getQuantity());
            entries.add(entry);
        }
        return inventoryEntryRepository.saveAll(entries);
    }

    public List<InventoryEntry> findAll() {
        return inventoryEntryRepository.findAll();
    }

    @Transactional
    public void deleteAll() {
        inventoryEntryRepository.deleteAll();
    }

    @Transactional
    public void deleteById(Long id) {
        inventoryEntryRepository.deleteById(id);
    }
}
