package com.inventory.demo.service;

import com.inventory.demo.dto.FeedbackRequest;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Service;

@Service
public class FeedbackService {

    private static final Path FEEDBACK_FILE = Path.of("data", "feedback.txt");
    private static final DateTimeFormatter TIMESTAMP = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public void save(FeedbackRequest request) {
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new IllegalArgumentException("Feedback message is required");
        }

        String worker = request.getWorkerName() != null ? request.getWorkerName().trim() : "Nieznany";
        String section = request.getSectionName() != null && !request.getSectionName().isBlank()
                ? request.getSectionName().trim()
                : "—";
        String message = request.getMessage().trim().replace("\r\n", "\n");

        String entry = "[" + TIMESTAMP.format(LocalDateTime.now()) + "] "
                + "[aplikacja] " + worker + " | sekcja: " + section + "\n"
                + message + "\n"
                + "---\n";

        try {
            Files.createDirectories(FEEDBACK_FILE.getParent());
            Files.writeString(
                    FEEDBACK_FILE,
                    entry,
                    StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.APPEND);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not save feedback", exception);
        }
    }
}
