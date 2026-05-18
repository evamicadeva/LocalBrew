package com.project.localbrew.entity;
import com.project.localbrew.entity.User;
import com.project.localbrew.entity.Drink;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;



@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name = "favorite_drinks",  uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "drink_id"})
    })


public class FavoriteDrink {	
	
	  @Id
	    @GeneratedValue(strategy = GenerationType.UUID)
	    private UUID id;

	    @ManyToOne
	    @JoinColumn(name = "user_id", nullable = false)
	    private User user;

	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "drink_id", nullable = false)
	    private Drink drink;

	    @CreationTimestamp
	    @Column(nullable = false, updatable = false)
	    private LocalDateTime savedAt;
	}


