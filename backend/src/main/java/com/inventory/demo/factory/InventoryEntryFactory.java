package com.inventory.demo.factory;

import com.inventory.demo.entity.InventoryEntry;
import com.inventory.demo.entity.Product;
import java.util.Optional;

public final class InventoryEntryFactory {

    private InventoryEntryFactory() {
    }

    public static InventoryEntry draft(Optional<InventoryEntry> existing, Product product, Double quantity) {
        InventoryEntry base = existing.orElseGet(InventoryEntry::new);
        return InventoryEntry.builder()
                .id(base.getId())
                .productId(product.getId())
                .productName(product.getName())
                .quantity(quantity)
                .submitted(false)
                .build();
    }

    public static InventoryEntry submitted(Optional<InventoryEntry> existing, Product product, Double quantity) {
        InventoryEntry base = existing.orElseGet(InventoryEntry::new);
        return InventoryEntry.builder()
                .id(base.getId())
                .productId(product.getId())
                .productName(product.getName())
                .quantity(quantity)
                .submitted(true)
                .build();
    }

    public static InventoryEntry withUpdatedQuantity(InventoryEntry entry, Double quantity) {
        return entry.toBuilder()
                .quantity(quantity)
                .submitted(true)
                .build();
    }
}
