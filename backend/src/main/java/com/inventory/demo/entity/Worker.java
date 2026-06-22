package com.inventory.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.HashSet;
import java.util.Set;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Data
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"first_name", "last_name"}))
public class Worker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "working_today", nullable = false)
    private boolean workingToday = false;

    @ManyToMany(mappedBy = "workers")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Section> sections = new HashSet<>();
}
