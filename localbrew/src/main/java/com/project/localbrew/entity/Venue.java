package com.project.localbrew.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "venues")
public class Venue {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private UUID id;

	@Column(nullable = false, length = 50)
	private String name;

	@Column(length = 500)
	private String desription;

	@Column(nullable = false, length = 70)
	private String adress;

	@Column(nullable = false)
	private Double latitude;

	@Column(nullable = false)
	private Double longitude;

	@Column(nullable = false)
	@Enumerated(EnumType.STRING)
	private VenueType type;

	@Column(nullable = false)
	@Enumerated(EnumType.STRING)
	private StatusVenue status;

	@Column(nullable = false)
	private LocalDate createdAt;

	@ManyToOne
	@JoinColumn(name = "user_id")
	private User owner;
}
