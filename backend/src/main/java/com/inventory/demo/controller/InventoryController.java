package com.inventory.demo.controller;

import com.inventory.demo.dto.InventoryEntryRequest;
import com.inventory.demo.entity.InventoryEntry;
import com.inventory.demo.entity.Product;
import com.inventory.demo.service.ExportService;
import com.inventory.demo.service.InventoryService;
import com.inventory.demo.service.ProductService;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class InventoryController {

    private final ProductService productService;
    private final InventoryService inventoryService;
    private final ExportService exportService;

    public InventoryController(ProductService productService,
                               InventoryService inventoryService,
                               ExportService exportService) {
        this.productService = productService;
        this.inventoryService = inventoryService;
        this.exportService = exportService;
    }

    @GetMapping("/workers")
    public List<String> getWorkers() {
        return productService.getWorkers();
    }

    @GetMapping("/products")
    public List<Product> getProducts(@RequestParam String worker) {
        return productService.getProductsForWorker(worker);
    }

    @PostMapping("/inventory")
    @ResponseStatus(HttpStatus.CREATED)
    public void saveInventory(@RequestBody List<InventoryEntryRequest> entries) {
        inventoryService.saveEntries(entries);
    }

    @GetMapping("/inventory")
    public List<InventoryEntry> getInventory() {
        return inventoryService.findAll();
    }

    @DeleteMapping("/inventory")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAllInventory() {
        inventoryService.deleteAll();
    }

    @DeleteMapping("/inventory/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteInventoryEntry(@PathVariable Long id) {
        inventoryService.deleteById(id);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export() {
        byte[] body = exportService.buildCsv().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"inventory.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(body);
    }
}
