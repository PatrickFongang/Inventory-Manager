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
public class SectionView {

    private Long id;
    private String name;
    private Integer sortOrder;

    @Builder.Default
    private List<WorkerView> workers = new ArrayList<>();
}
