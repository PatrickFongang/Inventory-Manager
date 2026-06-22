package com.inventory.demo.controller;

import com.inventory.demo.dto.AdminOverviewResponse;
import com.inventory.demo.dto.CreateWorkerRequest;
import com.inventory.demo.dto.InventoryEntryRequest;
import com.inventory.demo.dto.SectionView;
import com.inventory.demo.dto.UpdateInventoryEntryRequest;
import com.inventory.demo.dto.UpdateWorkerWorkingTodayRequest;
import com.inventory.demo.dto.WorkerProductView;
import com.inventory.demo.dto.WorkerView;
import com.inventory.demo.entity.InventoryEntry;
import com.inventory.demo.service.ExportService;
import com.inventory.demo.service.InventoryService;
import com.inventory.demo.service.ProductService;
import com.inventory.demo.service.SectionService;
import com.inventory.demo.service.WorkerService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class InventoryController {

    private final WorkerService workerService;
    private final ProductService productService;
    private final SectionService sectionService;
    private final InventoryService inventoryService;
    private final ExportService exportService;

    public InventoryController(WorkerService workerService,
                               ProductService productService,
                               SectionService sectionService,
                               InventoryService inventoryService,
                               ExportService exportService) {
        this.workerService = workerService;
        this.productService = productService;
        this.sectionService = sectionService;
        this.inventoryService = inventoryService;
        this.exportService = exportService;
    }

    @GetMapping("/workers")
    public List<WorkerView> getWorkers(@RequestParam(required = false) String search) {
        return workerService.findAll(search);
    }

    @PostMapping("/workers")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkerView createWorker(@RequestBody CreateWorkerRequest request) {
        return workerService.create(request);
    }

    @PutMapping("/workers/{id}/working-today")
    public WorkerView updateWorkerWorkingToday(@PathVariable Long id,
                                               @RequestBody UpdateWorkerWorkingTodayRequest request) {
        return workerService.updateWorkingToday(id, request.isWorkingToday());
    }

    @PostMapping("/workers/reset-working-today")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetWorkersWorkingToday() {
        workerService.resetAllWorkingToday();
    }

    @DeleteMapping("/workers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteWorker(@PathVariable Long id) {
        workerService.delete(id);
    }

    @GetMapping("/sections")
    public List<SectionView> getSections(@RequestParam(required = false) Boolean activeOnly) {
        return sectionService.findAllViews(Boolean.TRUE.equals(activeOnly));
    }

    @PutMapping("/sections/{id}/workers")
    public SectionView updateSectionWorkers(@PathVariable Long id, @RequestBody List<Long> workerIds) {
        return sectionService.updateWorkers(id, workerIds);
    }

    @GetMapping("/products")
    public List<WorkerProductView> getProducts(@RequestParam Long workerId,
                                               @RequestParam(required = false) Boolean pendingOnly) {
        return productService.getProductsForWorkerWithStatus(workerId, pendingOnly);
    }

    @PostMapping("/inventory/draft")
    public InventoryEntry saveDraft(@RequestBody InventoryEntryRequest request) {
        return inventoryService.saveDraft(request);
    }

    @PostMapping("/inventory")
    @ResponseStatus(HttpStatus.CREATED)
    public void saveInventory(@RequestBody List<InventoryEntryRequest> entries) {
        inventoryService.submitEntries(entries);
    }

    @PutMapping("/inventory/{id}")
    public InventoryEntry updateInventoryEntry(@PathVariable Long id,
                                               @RequestBody UpdateInventoryEntryRequest request) {
        return inventoryService.updateEntry(id, request);
    }

    @PutMapping("/inventory/product/{productId}")
    public InventoryEntry adminSaveProduct(@PathVariable Long productId,
                                           @RequestBody UpdateInventoryEntryRequest request) {
        return inventoryService.adminSaveProduct(productId, request);
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

    @GetMapping("/admin/overview")
    public AdminOverviewResponse getAdminOverview() {
        return inventoryService.getAdminOverview();
    }

    @GetMapping("/admin/sections/{id}/products")
    public List<AdminOverviewResponse.EditableProductView> getSectionProducts(@PathVariable Long id) {
        return inventoryService.getEditableProductsForSection(id);
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
