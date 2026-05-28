package com.project.localbrew.service;

import com.project.localbrew.dto.request.VenueDrinkRequest;
import com.project.localbrew.dto.response.VenueDrinkResponse;
import com.project.localbrew.entity.*;
import com.project.localbrew.repository.DrinkRepository;
import com.project.localbrew.repository.VenueDrinkRepository;
import com.project.localbrew.repository.VenueRepository;
import com.project.localbrew.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class VenueDrinkServiceImpl implements VenueDrinkService {

    private final VenueDrinkRepository venueDrinkRepository;
    private final VenueRepository venueRepository;
    private final DrinkRepository drinkRepository;
    private final CurrentUserService currentUserService;

    public VenueDrinkServiceImpl(VenueDrinkRepository venueDrinkRepository, VenueRepository venueRepository, DrinkRepository drinkRepository, CurrentUserService currentUserService) {
        this.venueDrinkRepository = venueDrinkRepository;
        this.venueRepository = venueRepository;
        this.drinkRepository = drinkRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    public List<VenueDrinkResponse> findAllByVenueId(UUID venueId) {
        if (venueId == null) {
            throw new IllegalArgumentException("Venue ID non puo essere null");
        }

        Venue venue = findVenueById(venueId);
        if (venue.getStatus() != VenueStatus.ACTIVE) {
            throw new EntityNotFoundException("Venue non trovata con ID: " + venueId);
        }

        return venueDrinkRepository.findByVenueId(venueId).stream().map(this::toResponse).toList();
    }

    @Override
    public VenueDrinkResponse addDrinkToVenue(UUID venueId, VenueDrinkRequest request) {
        if (venueId == null) {
            throw new IllegalArgumentException("Venue ID non puo essere null");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request non puo essere null");
        }

        Venue venue = findVenueById(venueId);
        ensureCanManageVenue(venue);

        Drink drink = drinkRepository.findById(request.getDrinkId()).orElseThrow(() -> new EntityNotFoundException("Drink non trovato con ID: " + request.getDrinkId()));

        boolean exists = venueDrinkRepository.existsByVenueIdAndDrinkId(venue.getId(), drink.getId());
        if (exists) {
            throw new IllegalArgumentException("Drink gia presente nel menu della venue");
        }

        VenueDrink venueDrink = VenueDrink.builder().venue(venue).drink(drink).price(request.getPrice()).build();

        return toResponse(venueDrinkRepository.save(venueDrink));
    }

    @Override
    public VenueDrinkResponse updateVenueDrink(UUID venueId, UUID drinkId, VenueDrinkRequest request) {
        if (venueId == null) {
            throw new IllegalArgumentException("Venue ID non puo essere null");
        }
        if (drinkId == null) {
            throw new IllegalArgumentException("Drink ID non puo essere null");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request non puo essere null");
        }

        Venue venue = findVenueById(venueId);
        ensureCanManageVenue(venue);

        VenueDrink venueDrink = venueDrinkRepository.findByVenueIdAndDrinkId(venueId, drinkId).orElseThrow(() -> new EntityNotFoundException("Drink non trovato nel menu della venue"));

        if (request.getPrice() != null) {
            venueDrink.setPrice(request.getPrice());
        }

        return toResponse(venueDrinkRepository.save(venueDrink));
    }

    @Override
    public void removeDrinkFromVenue(UUID venueId, UUID drinkId) {
        if (venueId == null) {
            throw new IllegalArgumentException("Venue ID non puo essere null");
        }
        if (drinkId == null) {
            throw new IllegalArgumentException("Drink ID non puo essere null");
        }

        Venue venue = findVenueById(venueId);
        ensureCanManageVenue(venue);

        VenueDrink venueDrink = venueDrinkRepository.findByVenueIdAndDrinkId(venueId, drinkId).orElseThrow(() -> new EntityNotFoundException("Drink non trovato nel menu della venue"));

        venueDrinkRepository.delete(venueDrink);
    }

    private Venue findVenueById(UUID id) {
        return venueRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Venue non trovata con ID: " + id));
    }

    private void ensureCanManageVenue(Venue venue) {
        User currentUser = currentUserService.getCurrentUser();
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isOwnerOfVenue = venue.getOwner().getId().equals(currentUser.getId());

        if (!isAdmin && !isOwnerOfVenue) {
            throw new AccessDeniedException("Non puoi modificare il menu di questo locale");
        }
    }

    private VenueDrinkResponse toResponse(VenueDrink venueDrink) {
        Venue venue = venueDrink.getVenue();
        Drink drink = venueDrink.getDrink();

        return VenueDrinkResponse.builder().id(venueDrink.getId()).venueId(venue.getId()).venueName(venue.getName()).drinkId(drink.getId()).drinkName(drink.getName()).drinkDescription(drink.getDescription()).category(drink.getCategory()).abv(drink.getAbv()).origin(drink.getOrigin()).imageUri(drink.getImageUri()).price(venueDrink.getPrice()).build();
    }
}
