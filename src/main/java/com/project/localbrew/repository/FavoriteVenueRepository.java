package com.project.localbrew.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.localbrew.entity.FavoriteVenue;

@Repository
public interface FavoriteVenueRepository extends JpaRepository<FavoriteVenue, UUID> {

    boolean existsByUserIdAndVenueId(UUID userId, UUID venueId);

    List<FavoriteVenue> findAllByUserId(UUID userId);

    Optional<FavoriteVenue> findByUserIdAndVenueId(UUID userId, UUID venueId);

    void deleteAllByUserId(UUID userId);

    void deleteAllByVenueId(UUID venueId);
}
