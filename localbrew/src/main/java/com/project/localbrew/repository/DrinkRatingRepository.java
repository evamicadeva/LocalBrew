package com.project.localbrew.repository;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.localbrew.entity.DrinkRating;

@Repository
public interface DrinkRatingRepository extends JpaRepository<DrinkRating, UUID> {

}
