package com.inventory.demo.factory;

import com.inventory.demo.dto.SectionView;
import com.inventory.demo.entity.Section;

public final class SectionViewFactory {

    private SectionViewFactory() {
    }

    public static SectionView fromSection(Section section) {
        return fromSection(section, false);
    }

    public static SectionView fromSection(Section section, boolean activeWorkersOnly) {
        return SectionView.builder()
                .id(section.getId())
                .name(section.getName())
                .sortOrder(section.getSortOrder())
                .workers(WorkerViewFactory.fromWorkers(
                        section.getWorkers(),
                        activeWorkersOnly))
                .build();
    }
}
