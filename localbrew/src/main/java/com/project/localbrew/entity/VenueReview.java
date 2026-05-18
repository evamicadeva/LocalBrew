package com.project.localbrew.entity;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "venue_reviews")
public class VenueReview {
	@Id
	@GeneratedValue (strategy = GenerationType.UUID)
	private UUID id;
	@Column(nullable = false)
	@Min(value = 1,message = "Il rating deve essere almeno 1")
	@Max(value = 5,message = "Il rating deve essere massimo 5")
	private Integer rating;
	@Column(nullable = true, length = 500)
	private String comment;
	@Column(nullable = false)
	private LocalDate createdAt;
	
	@ManyToOne
	@JoinColumn(name = "user_id")
	private User userId;
	@ManyToOne
	@JoinColumn(name = "venue_id")
	private Venue venueId;
}
