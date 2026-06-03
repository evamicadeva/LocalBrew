package com.project.localbrew.service;

import com.project.localbrew.dto.request.VenueReviewRequest;
import com.project.localbrew.dto.response.VenueReviewResponse;

import java.util.List;
import java.util.UUID;

public interface VenueReviewService {

    List<VenueReviewResponse> findAllReviews();

    VenueReviewResponse findReviewById(UUID id);

    VenueReviewResponse saveReview(VenueReviewRequest request);

    VenueReviewResponse updateReviewById(VenueReviewRequest request, UUID id);

    void deleteReview(UUID id);

    List<VenueReviewResponse> findReviewsByVenueId(UUID venueId);

    List<VenueReviewResponse> findReviewsByUserId(UUID userId);

    List<VenueReviewResponse> findMyReviews();
}
