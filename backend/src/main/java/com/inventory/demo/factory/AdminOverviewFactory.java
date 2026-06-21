package com.inventory.demo.factory;

import com.inventory.demo.dto.AdminOverviewResponse;
import com.inventory.demo.dto.WorkerProductView;
import com.inventory.demo.entity.InventoryEntry;
import com.inventory.demo.entity.Product;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class AdminOverviewFactory {

    private AdminOverviewFactory() {
    }

    public static AdminOverviewResponse.PendingProductView pendingProduct(Product product) {
        return AdminOverviewResponse.PendingProductView.builder()
                .id(product.getId())
                .name(product.getName())
                .build();
    }

    public static AdminOverviewResponse.SubmittedEntryView submittedEntry(Product product,
                                                                          InventoryEntry entry) {
        return AdminOverviewResponse.SubmittedEntryView.builder()
                .entryId(entry.getId())
                .productId(product.getId())
                .productName(product.getName())
                .quantity(entry.getQuantity())
                .build();
    }

    public static AdminOverviewResponse.ProductAssignmentView productAssignment(Product product) {
        return AdminOverviewResponse.ProductAssignmentView.builder()
                .id(product.getId())
                .name(product.getName())
                .assignedWorker(product.getAssignedWorker())
                .sortOrder(product.getSortOrder())
                .build();
    }

    public static AdminOverviewResponse.WorkerStatusView workerStatus(String worker,
                                                                      List<Product> assignedProducts,
                                                                      Map<Long, InventoryEntry> entriesByProductId) {
        List<AdminOverviewResponse.SubmittedEntryView> entries = new ArrayList<>();
        List<AdminOverviewResponse.PendingProductView> pendingProducts = new ArrayList<>();

        for (Product product : assignedProducts) {
            InventoryEntry entry = entriesByProductId.get(product.getId());
            if (entry != null && entry.isSubmitted()) {
                entries.add(submittedEntry(product, entry));
            } else {
                pendingProducts.add(pendingProduct(product));
            }
        }

        return AdminOverviewResponse.WorkerStatusView.builder()
                .name(worker)
                .totalProducts(assignedProducts.size())
                .completedCount(entries.size())
                .pendingProducts(pendingProducts)
                .entries(entries)
                .build();
    }

    public static Map<String, List<Product>> groupProductsByWorker(List<Product> products) {
        Map<String, List<Product>> productsByWorker = new HashMap<>();
        for (Product product : products) {
            productsByWorker.computeIfAbsent(product.getAssignedWorker(), key -> new ArrayList<>())
                    .add(product);
        }
        return productsByWorker;
    }
}
