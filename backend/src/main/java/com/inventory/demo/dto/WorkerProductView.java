package com.inventory.demo.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerProductView {

    private Long id;
    private String name;
    private String assignedWorker;
    private Integer sortOrder;
    private boolean submitted;
    private Long entryId;
    private Double quantity;
}
