package com.project.localbrew.entity;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@Getter
@Setter
@NoArgsConstructor
@Slf4j
@Entity
@Table(name = "books")
public class Venue {
	@Id
	@GeneratedValue (strategy = GenerationType.AUTO)
	private UUID id;
	@Column (nullable = false, length = 50)
	private String name;
	@Column (nullable = true, length = 500)
	private String desription;
	@Column (nullable = false, length = 70)
	private String adress;
	@Column (nullable = false)
	private Double latitude;
	@Column (nullable = false)
	private Double longitude;
	@Column (nullable = false)
	@Enumerated(EnumType.STRING)
	private VenueType type;
	@Column (nullable = false)
	@Enumerated(EnumType.STRING)
	private StatusVenue status;
	@Column (nullable = false)
	private LocalDate createdAt;
	
	@ManyToOne
	@JoinColumn(name = "user_id")
	private User ownerId;
	}
