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
public class AdminOverviewResponse {

    @Builder.Default
    private List<WorkerStatusView> workers = new ArrayList<>();

    @Builder.Default
    private List<ProductAssignmentView> products = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkerStatusView {
        private String name;
        private int totalProducts;
        private int completedCount;

        @Builder.Default
        private List<PendingProductView> pendingProducts = new ArrayList<>();

        @Builder.Default
        private List<SubmittedEntryView> entries = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PendingProductView {
        private Long id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmittedEntryView {
        private Long entryId;
        private Long productId;
        private String productName;
        private Double quantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductAssignmentView {
        private Long id;
        private String name;
        private String assignedWorker;
        private Integer sortOrder;
    }
}
