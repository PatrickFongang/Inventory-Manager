package com.inventory.demo.factory;

import com.inventory.demo.dto.AdminOverviewResponse;
import com.inventory.demo.entity.InventoryEntry;
import com.inventory.demo.entity.Product;
import com.inventory.demo.entity.Section;
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

    public static AdminOverviewResponse.SectionStatusView sectionStatus(Section section,
                                                                        List<Product> sectionProducts,
                                                                        Map<Long, InventoryEntry> entriesByProductId) {
        List<AdminOverviewResponse.SubmittedEntryView> entries = new ArrayList<>();
        List<AdminOverviewResponse.PendingProductView> pendingProducts = new ArrayList<>();
        List<AdminOverviewResponse.EditableProductView> editableProducts = new ArrayList<>();

        for (Product product : sectionProducts) {
            InventoryEntry entry = entriesByProductId.get(product.getId());
            editableProducts.add(editableProduct(product, entry));
            if (entry != null && entry.isSubmitted()) {
                entries.add(submittedEntry(product, entry));
            } else {
                pendingProducts.add(pendingProduct(product));
            }
        }

        return AdminOverviewResponse.SectionStatusView.builder()
                .id(section.getId())
                .name(section.getName())
                .totalProducts(sectionProducts.size())
                .completedCount(entries.size())
                .workers(WorkerViewFactory.fromWorkers(section.getWorkers(), true))
                .pendingProducts(pendingProducts)
                .entries(entries)
                .editableProducts(editableProducts)
                .build();
    }

    public static AdminOverviewResponse.EditableProductView editableProduct(Product product,
                                                                            InventoryEntry entry) {
        return AdminOverviewResponse.EditableProductView.builder()
                .productId(product.getId())
                .productName(product.getName())
                .entryId(entry != null ? entry.getId() : null)
                .quantity(entry != null ? entry.getQuantity() : null)
                .submitted(entry != null && entry.isSubmitted())
                .build();
    }

    public static Map<String, List<Product>> groupProductsBySection(List<Product> products) {
        Map<String, List<Product>> productsBySection = new HashMap<>();
        for (Product product : products) {
            productsBySection.computeIfAbsent(product.getSectionName(), key -> new ArrayList<>())
                    .add(product);
        }
        return productsBySection;
    }
}
