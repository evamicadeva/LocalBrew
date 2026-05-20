package com.project.localbrew.repository;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.localbrew.entity.VenueDrink;

@Repository
public interface VenueDrinkRepository extends JpaRepository<VenueDrink, UUID> {

    List<VenueDrink> findByVenueId(UUID venueId);

    List<VenueDrink> findByDrinkId(UUID drinkId);

    boolean existsByVenueIdAndDrinkId(UUID venueId, UUID drinkId);

}
