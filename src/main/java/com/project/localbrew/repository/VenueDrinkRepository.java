package com.project.localbrew.repository;

import com.project.localbrew.entity.VenueDrink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VenueDrinkRepository extends JpaRepository<VenueDrink, UUID> {

    List<VenueDrink> findByVenueId(UUID venueId);

    boolean existsByVenueIdAndDrinkId(UUID venueId, UUID drinkId);

    Optional<VenueDrink> findByVenueIdAndDrinkId(UUID venueId, UUID drinkId);

    void deleteAllByVenueId(UUID venueId);
}
