package com.inventory.demo.service;

import com.inventory.demo.dto.SectionView;
import com.inventory.demo.entity.Section;
import com.inventory.demo.entity.Worker;
import com.inventory.demo.factory.SectionViewFactory;
import com.inventory.demo.repository.SectionRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SectionService {

    private final SectionRepository sectionRepository;
    private final WorkerService workerService;

    public SectionService(SectionRepository sectionRepository, WorkerService workerService) {
        this.sectionRepository = sectionRepository;
        this.workerService = workerService;
    }

    public List<SectionView> findAllViews() {
        return findAllViews(false);
    }

    public List<SectionView> findAllViews(boolean activeWorkersOnly) {
        return sectionRepository.findAllWithWorkersOrderBySortOrderAsc().stream()
                .map(section -> SectionViewFactory.fromSection(section, activeWorkersOnly))
                .toList();
    }

    public List<Section> findSectionsForWorker(Long workerId) {
        workerService.findById(workerId);
        return sectionRepository.findByWorkerIdOrderBySortOrderAsc(workerId);
    }

    public List<Section> findAllOrderedWithWorkers() {
        return sectionRepository.findAllWithWorkersOrderBySortOrderAsc();
    }

    public Section findById(Long sectionId) {
        return sectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Section not found: " + sectionId));
    }

    @Transactional
    public SectionView updateWorkers(Long sectionId, List<Long> workerIds) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Section not found: " + sectionId));

        Set<Worker> workers = new HashSet<>(workerService.findAllByIds(workerIds));
        section.setWorkers(workers);
        Section saved = sectionRepository.save(section);
        return SectionViewFactory.fromSection(saved);
    }
}
