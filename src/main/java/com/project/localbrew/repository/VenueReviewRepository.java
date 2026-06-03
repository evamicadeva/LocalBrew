package com.project.localbrew.repository;

import com.project.localbrew.entity.VenueReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VenueReviewRepository extends JpaRepository<VenueReview, UUID> {

    boolean existsByUserIdAndVenueId(UUID userId, UUID venueId);

    List<VenueReview> findAllByVenueId(UUID venueId);

    List<VenueReview> findAllByUserId(UUID userId);

    void deleteAllByUserId(UUID userId);

    void deleteAllByVenueId(UUID venueId);
}
