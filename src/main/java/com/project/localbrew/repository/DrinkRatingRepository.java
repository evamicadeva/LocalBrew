package com.project.localbrew.repository;

import com.project.localbrew.entity.DrinkRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DrinkRatingRepository extends JpaRepository<DrinkRating, UUID> {
    boolean existsByUserIdAndDrinkId(UUID userId, UUID drinkId);

    List<DrinkRating> findAllByUserId(UUID id);

    List<DrinkRating> findAllByDrinkId(UUID id);

    void deleteAllByUserId(UUID userId);
}
