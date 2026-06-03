package com.project.localbrew.repository;

import com.project.localbrew.entity.FavoriteDrink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FavoriteDrinkRepository extends JpaRepository<FavoriteDrink, UUID> {
    boolean existsByUserIdAndDrinkId(UUID userId, UUID drinkId);

    List<FavoriteDrink> findAllByUserId(UUID userId);
    Optional<FavoriteDrink> findByUserIdAndDrinkId(UUID userId, UUID drinkId);

    void deleteAllByUserId(UUID userId);
}
