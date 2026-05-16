package com.project.localbrew.entity;



import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;


	@Getter
	@Setter
	@NoArgsConstructor
	@AllArgsConstructor
	@Builder
	@Entity
	@Table(name = "users")
	public class User {

	    @Id
	    @GeneratedValue(strategy = GenerationType.UUID)
	    private UUID id;
	    @NotBlank //spostare dopo su DTO
	    @Column(nullable = false, unique = true)
	    private String username;
	    @Email //spostare dopo su DTO 
	    @NotBlank //spostare dopo su DTO
	    @Column(nullable = false, unique = true)
	    private String email;
	    @NotBlank //spostare dopo su DTO
	    @Column(nullable = false)
	    private String passwordHash;
	    @Column(nullable = false)
	    @Enumerated(EnumType.STRING)
	    private Role role;
	    @CreationTimestamp
	    @Column(nullable = false, updatable = false)
	    private LocalDateTime createdAt;
	   
	    @JsonIgnore //evita ricorsione infinita prima di DTO
	    @OneToMany(mappedBy = "user")
	    private List<FavoriteDrink> favoriteDrinks;
}


