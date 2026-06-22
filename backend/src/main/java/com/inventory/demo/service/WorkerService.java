package com.inventory.demo.service;

import com.inventory.demo.dto.CreateWorkerRequest;
import com.inventory.demo.dto.WorkerView;
import com.inventory.demo.entity.Worker;
import com.inventory.demo.factory.WorkerViewFactory;
import com.inventory.demo.repository.SectionRepository;
import com.inventory.demo.repository.WorkerRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkerService {

    private final WorkerRepository workerRepository;
    private final SectionRepository sectionRepository;

    public WorkerService(WorkerRepository workerRepository, SectionRepository sectionRepository) {
        this.workerRepository = workerRepository;
        this.sectionRepository = sectionRepository;
    }

    public List<WorkerView> findAll(String search) {
        List<Worker> workers = search == null || search.isBlank()
                ? workerRepository.findAllByOrderByLastNameAscFirstNameAsc()
                : workerRepository.searchByName(search.trim());
        return WorkerViewFactory.fromWorkers(workers);
    }

    @Transactional
    public WorkerView create(CreateWorkerRequest request) {
        if (request.getFirstName() == null || request.getFirstName().isBlank()) {
            throw new IllegalArgumentException("First name is required");
        }
        if (request.getLastName() == null || request.getLastName().isBlank()) {
            throw new IllegalArgumentException("Last name is required");
        }
        String rawName = request.getFirstName().trim().toLowerCase();
        String firstName = Character.toTitleCase(rawName.charAt(0)) + rawName.substring(1);
        String rawLastName = request.getLastName().trim().toLowerCase();
        String lastName = Character.toTitleCase(rawLastName.charAt(0)) + rawLastName.substring(1);
        workerRepository.findByFirstNameIgnoreCaseAndLastNameIgnoreCase(firstName, lastName).ifPresent(existing -> {
            throw new IllegalArgumentException("Worker already exists: " + firstName + " " + lastName);
        });
        Worker worker = new Worker();
        worker.setFirstName(firstName);
        worker.setLastName(lastName);
        worker.setWorkingToday(false);
        return WorkerViewFactory.fromWorker(workerRepository.save(worker));
    }

    @Transactional
    public WorkerView updateWorkingToday(Long workerId, boolean workingToday) {
        Worker worker = findById(workerId);
        worker.setWorkingToday(workingToday);
        if (!workingToday) {
            sectionRepository.findByWorkerIdOrderBySortOrderAsc(workerId).forEach(section -> {
                section.getWorkers().remove(worker);
                sectionRepository.save(section);
            });
        }
        return WorkerViewFactory.fromWorker(workerRepository.save(worker));
    }

    @Transactional
    public void resetAllWorkingToday() {
        workerRepository.resetAllWorkingToday();
    }

    @Transactional
    public void delete(Long workerId) {
        if (!workerRepository.existsById(workerId)) {
            return;
        }
        Worker worker = findById(workerId);
        sectionRepository.findByWorkerIdOrderBySortOrderAsc(workerId).forEach(section -> {
            section.getWorkers().remove(worker);
            sectionRepository.save(section);
        });
        workerRepository.delete(worker);
    }

    public Worker findById(Long workerId) {
        return workerRepository.findById(workerId)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found: " + workerId));
    }

    public List<Worker> findAllByIds(List<Long> workerIds) {
        List<Worker> workers = workerRepository.findAllById(workerIds);
        if (workers.size() != workerIds.size()) {
            throw new IllegalArgumentException("One or more workers not found");
        }
        return workers;
    }
}
