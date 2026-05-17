package com.project.localbrew.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
@Entity
@Table(name = "venue_drinks", uniqueConstraints = @UniqueConstraint(columnNames = {"venue_id", "drink_id"}))
public class VenueDrink {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(precision = 6, scale = 2)
    private BigDecimal price;

    @ManyToOne
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;

    @ManyToOne
    @JoinColumn(name = "drink_id", nullable = false)
    private Drink drink;
}