package com.inventory.demo.factory;

import com.inventory.demo.dto.WorkerProductView;
import com.inventory.demo.entity.InventoryEntry;
import com.inventory.demo.entity.Product;

public final class WorkerProductViewFactory {

    private WorkerProductViewFactory() {
    }

    public static WorkerProductView fromProduct(Product product, InventoryEntry entry) {
        WorkerProductView.WorkerProductViewBuilder builder = WorkerProductView.builder()
                .id(product.getId())
                .name(product.getName())
                .sectionName(product.getSectionName())
                .sortOrder(product.getSortOrder())
                .submitted(entry != null && entry.isSubmitted());

        if (entry != null) {
            builder.entryId(entry.getId())
                    .quantity(entry.getQuantity());
        }

        return builder.build();
    }
}
