package com.project.localbrew.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "drink_ratings", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "drink_id"}))
public class DrinkRating {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;   // FK → USER

    @Column(name = "drink_id", nullable = false)
    private UUID drinkId;  // FK → DRINK

    @Column(nullable = false)
    private Integer rating; // DTO validation

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

