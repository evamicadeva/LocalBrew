package com.project.localbrew.entity;



import java.time.LocalDateTime;

import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

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
	    @NotBlank
	    @Column(nullable = false, unique = true)
	    private String username;
	    @Email
	    @NotBlank
	    @Column(nullable = false, unique = true)
	    private String email;
	    @NotBlank
	    @Column(nullable = false)
	    private String passwordHash;
	    @Column(nullable = false)
	    @Enumerated(EnumType.STRING)
	    private Role role;
	    @CreationTimestamp
	    @Column(nullable = false, updatable = false)
	    private LocalDateTime createdAt;
	   
}


