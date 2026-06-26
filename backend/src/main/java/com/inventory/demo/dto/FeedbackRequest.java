package com.inventory.demo.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FeedbackRequest {

    private Long workerId;
    private String workerName;
    private String sectionName;
    private String message;
}
