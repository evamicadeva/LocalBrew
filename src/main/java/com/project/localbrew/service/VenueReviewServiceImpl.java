package com.project.localbrew.service;

import com.project.localbrew.dto.request.VenueReviewRequest;
import com.project.localbrew.dto.response.VenueReviewResponse;
import com.project.localbrew.entity.Role;
import com.project.localbrew.entity.User;
import com.project.localbrew.entity.Venue;
import com.project.localbrew.entity.VenueReview;
import com.project.localbrew.repository.VenueRepository;
import com.project.localbrew.repository.VenueReviewRepository;
import com.project.localbrew.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class VenueReviewServiceImpl implements VenueReviewService {

    private final VenueReviewRepository venueReviewRepository;
    private final VenueRepository venueRepository;
    private final CurrentUserService currentUserService;

    public VenueReviewServiceImpl(VenueReviewRepository venueReviewRepository, VenueRepository venueRepository, CurrentUserService currentUserService) {
        this.venueReviewRepository = venueReviewRepository;
        this.venueRepository = venueRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    public List<VenueReviewResponse> findAllReviews() {
        return venueReviewRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public VenueReviewResponse findReviewById(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("ID non puo essere null");
        }

        return toResponse(findEntityById(id));
    }

    @Override
    public VenueReviewResponse saveReview(VenueReviewRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request non puo essere null");
        }

        User currentUser = currentUserService.getCurrentUser();
        Venue venue = venueRepository.findById(request.getVenueId()).orElseThrow(() -> new EntityNotFoundException("Venue non trovata con ID: " + request.getVenueId()));

        boolean alreadyReviewed = venueReviewRepository.existsByUserIdAndVenueId(currentUser.getId(), venue.getId());

        if (alreadyReviewed) {
            throw new IllegalArgumentException("Hai gia recensito questa venue");
        }

        VenueReview review = VenueReview.builder().rating(request.getRating()).comment(request.getComment()).createdAt(LocalDateTime.now()).user(currentUser).venue(venue).build();

        return toResponse(venueReviewRepository.save(review));
    }

    @Override
    public VenueReviewResponse updateReviewById(VenueReviewRequest request, UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("ID non puo essere null");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request non puo essere null");
        }

        VenueReview existingReview = findEntityById(id);
        User currentUser = currentUserService.getCurrentUser();

        if (!existingReview.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Non puoi modificare recensioni di altri utenti");
        }

        if (request.getRating() != null && request.getRating() >= 1 && request.getRating() <= 5) {
            existingReview.setRating(request.getRating());
        }

        if (request.getComment() != null) {
            existingReview.setComment(request.getComment());
        }

        return toResponse(venueReviewRepository.save(existingReview));
    }

    @Override
    public void deleteReview(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("ID non puo essere null");
        }

        VenueReview review = findEntityById(id);
        User currentUser = currentUserService.getCurrentUser();

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isReviewOwner = review.getUser().getId().equals(currentUser.getId());

        if (!isAdmin && !isReviewOwner) {
            throw new AccessDeniedException("Non puoi eliminare recensioni di altri utenti");
        }

        venueReviewRepository.delete(review);
    }

    @Override
    public List<VenueReviewResponse> findReviewsByVenueId(UUID venueId) {
        if (venueId == null) {
            throw new IllegalArgumentException("Venue ID non puo essere null");
        }

        return venueReviewRepository.findAllByVenueId(venueId).stream().map(this::toResponse).toList();
    }

    @Override
    public List<VenueReviewResponse> findReviewsByUserId(UUID userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID non puo essere null");
        }

        return venueReviewRepository.findAllByUserId(userId).stream().map(this::toResponse).toList();
    }

    private VenueReview findEntityById(UUID id) {
        return venueReviewRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Recensione non trovata con ID: " + id));
    }

    private VenueReviewResponse toResponse(VenueReview review) {
        return VenueReviewResponse.builder().id(review.getId()).rating(review.getRating()).comment(review.getComment()).createdAt(review.getCreatedAt()).username(review.getUser() != null ? review.getUser().getUsername() : null).venueName(review.getVenue() != null ? review.getVenue().getName() : null).build();
    }
}
