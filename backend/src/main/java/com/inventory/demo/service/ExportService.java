package com.inventory.demo.service;

import com.inventory.demo.entity.Product;
import com.inventory.demo.repository.InventoryEntryRepository;
import com.inventory.demo.repository.ProductRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ExportService {

    private final ProductRepository productRepository;
    private final InventoryEntryRepository inventoryEntryRepository;

    public ExportService(ProductRepository productRepository,
                         InventoryEntryRepository inventoryEntryRepository) {
        this.productRepository = productRepository;
        this.inventoryEntryRepository = inventoryEntryRepository;
    }

    public String buildCsv() {
        Map<String, Double> totals = new HashMap<>();
        for (Object[] row : inventoryEntryRepository.sumQuantitiesByProduct()) {
            String productName = (String) row[0];
            Double sum = row[1] == null ? 0.0 : ((Number) row[1]).doubleValue();
            totals.put(productName, sum);
        }

        List<Product> products = productRepository.findAllByOrderBySortOrderAsc();

        StringBuilder builder = new StringBuilder();
        builder.append('\uFEFF');
        builder.append("Produkt;Ilosc\n");
        for (Product product : products) {
            double quantity = totals.getOrDefault(product.getName(), 0.0);
            builder.append(escape(product.getName()))
                    .append(';')
                    .append(formatQuantity(quantity))
                    .append('\n');
        }
        return builder.toString();
    }

    private String escape(String value) {
        if (value.contains(";") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String formatQuantity(double quantity) {
        if (quantity == Math.rint(quantity)) {
            return String.valueOf((long) quantity);
        }
        return String.valueOf(quantity).replace('.', ',');
    }
}
