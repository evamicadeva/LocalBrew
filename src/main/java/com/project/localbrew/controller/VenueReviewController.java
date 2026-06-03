package com.project.localbrew.controller;

import com.project.localbrew.dto.request.VenueReviewRequest;
import com.project.localbrew.dto.response.VenueReviewResponse;
import com.project.localbrew.service.VenueReviewService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1")
public class VenueReviewController {

    private final VenueReviewService venueReviewService;

    public VenueReviewController(VenueReviewService venueReviewService) {
        this.venueReviewService = venueReviewService;
    }

    @GetMapping("/admin/reviews")
    public ResponseEntity<List<VenueReviewResponse>> findAllReviews() {
        return ResponseEntity.ok(venueReviewService.findAllReviews());
    }

    @DeleteMapping("/admin/reviews/{id}")
    public ResponseEntity<Void> deleteReviewByAdmin(@PathVariable @NotNull(message = "ID non puo essere nullo") UUID id) {
        venueReviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/public/venues/{venueId}/reviews")
    public ResponseEntity<List<VenueReviewResponse>> findReviewsByVenueId(
            @PathVariable @NotNull(message = "Venue ID non puo essere nullo") UUID venueId
    ) {
        return ResponseEntity.ok(venueReviewService.findReviewsByVenueId(venueId));
    }

    @GetMapping("/user/venue-reviews")
    public ResponseEntity<List<VenueReviewResponse>> findMyReviews() {
        return ResponseEntity.ok(venueReviewService.findMyReviews());
    }

    @PostMapping("/user/venue-reviews")
    public ResponseEntity<VenueReviewResponse> saveReview(@Valid @RequestBody VenueReviewRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(venueReviewService.saveReview(request));
    }

    @PutMapping("/user/venue-reviews/{id}")
    public ResponseEntity<VenueReviewResponse> updateReview(
            @PathVariable @NotNull(message = "ID non puo essere nullo") UUID id,
            @Valid @RequestBody VenueReviewRequest request
    ) {
        return ResponseEntity.ok(venueReviewService.updateReviewById(request, id));
    }

    @DeleteMapping("/user/venue-reviews/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable @NotNull(message = "ID non puo essere nullo") UUID id) {
        venueReviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}
