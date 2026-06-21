package com.inventory.demo.dto;

import lombok.Data;

@Data
public class InventoryEntryRequest {

    private String workerName;
    private Long productId;
    private Double quantity;
}
