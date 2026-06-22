package com.inventory.demo.factory;

import com.inventory.demo.dto.WorkerView;
import com.inventory.demo.entity.Worker;
import java.util.Comparator;
import java.util.List;

public final class WorkerViewFactory {

    private WorkerViewFactory() {
    }

    public static WorkerView fromWorker(Worker worker) {
        return WorkerView.builder()
                .id(worker.getId())
                .firstName(worker.getFirstName())
                .lastName(worker.getLastName())
                .workingToday(worker.isWorkingToday())
                .build();
    }

    public static List<WorkerView> fromWorkers(Iterable<Worker> workers) {
        return fromWorkers(workers, false);
    }

    public static List<WorkerView> fromWorkers(Iterable<Worker> workers, boolean activeWorkersOnly) {
        return java.util.stream.StreamSupport.stream(workers.spliterator(), false)
                .filter(worker -> !activeWorkersOnly || worker.isWorkingToday())
                .sorted(Comparator.comparing(Worker::getLastName).thenComparing(Worker::getFirstName))
                .map(WorkerViewFactory::fromWorker)
                .toList();
    }
}
