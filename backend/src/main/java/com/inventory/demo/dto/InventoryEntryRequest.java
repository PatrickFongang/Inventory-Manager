package com.inventory.demo.dto;

import lombok.Data;

@Data
public class InventoryEntryRequest {

    private Long productId;
    private Double quantity;
}
