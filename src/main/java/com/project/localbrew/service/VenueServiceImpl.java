package com.project.localbrew.service;

import com.project.localbrew.dto.request.VenueRequest;
import com.project.localbrew.dto.response.VenueResponse;
import com.project.localbrew.entity.*;
import com.project.localbrew.repository.FavoriteVenueRepository;
import com.project.localbrew.repository.VenueDrinkRepository;
import com.project.localbrew.repository.VenueRepository;
import com.project.localbrew.repository.VenueReviewRepository;
import com.project.localbrew.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class VenueServiceImpl implements VenueService {

    private final VenueRepository venueRepository;
    private final VenueDrinkRepository venueDrinkRepository;
    private final VenueReviewRepository venueReviewRepository;
    private final FavoriteVenueRepository favoriteVenueRepository;
    private final CurrentUserService currentUserService;
    private final GeocodingService geocodingService;

    public VenueServiceImpl(
            VenueRepository venueRepository,
            VenueDrinkRepository venueDrinkRepository,
            VenueReviewRepository venueReviewRepository,
            FavoriteVenueRepository favoriteVenueRepository,
            CurrentUserService currentUserService,
            GeocodingService geocodingService
    ) {
        this.venueRepository = venueRepository;
        this.venueDrinkRepository = venueDrinkRepository;
        this.venueReviewRepository = venueReviewRepository;
        this.favoriteVenueRepository = favoriteVenueRepository;
        this.currentUserService = currentUserService;
        this.geocodingService = geocodingService;
    }

    @Override
    public List<VenueResponse> findAllVenues() {
        return venueRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<VenueResponse> findAllActiveVenuesByCity(String city) {
        if (city == null || city.isBlank()) {
            throw new IllegalArgumentException("City non può essere vuota");
        }
        return venueRepository.findAllByCityContainingIgnoreCaseAndStatus(city, VenueStatus.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<VenueResponse> findAllActiveVenues() {
        return venueRepository.findAllByStatus(VenueStatus.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<VenueResponse> findAllPendingVenues() {
        return venueRepository.findAllByStatus(VenueStatus.PENDING)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<VenueResponse> findAllSuspendedVenues() {
        return venueRepository.findAllByStatus(VenueStatus.SUSPENDED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public VenueResponse findVenueById(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("ID non può essere null");
        }
        return toResponse(findEntityById(id));
    }

    @Override
    public VenueResponse findActiveVenueById(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("ID non puo essere null");
        }

        Venue venue = findEntityById(id);
        if (venue.getStatus() != VenueStatus.ACTIVE) {
            throw new EntityNotFoundException("Venue non trovato con ID: " + id);
        }

        return toResponse(venue);
    }

    @Override
    public List<VenueResponse> findAllVenuesByCurrentOwner() {

        User owner = currentUserService.getCurrentUser();
        return venueRepository.findAllByOwnerId(owner.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<VenueResponse> findAllActiveVenuesByType(List<VenueType> types) {
        if (types == null || types.isEmpty()) {
            throw new IllegalArgumentException("La lista di types non può essere vuota");
        }
        return venueRepository.findAllByTypeInAndStatus(types, VenueStatus.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<VenueResponse> findAllActiveVenuesByName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name non può essere vuoto");
        }
        return venueRepository.findAllByNameContainingIgnoreCaseAndStatus(name, VenueStatus.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public VenueResponse saveVenue(VenueRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request non può essere null");
        }

        User currentUser = currentUserService.getCurrentUser();

        if (currentUser.getRole() != Role.OWNER) {
            throw new AccessDeniedException("Non puoi creare un locale");
        }

        Venue venue = toEntity(request);
        Coordinates coordinates = geocodingService.geocode(toFullAddress(venue.getAddress(), venue.getCity()));
        venue.setLatitude(coordinates.latitude());
        venue.setLongitude(coordinates.longitude());
        venue.setOwner(currentUser);
        venue.setStatus(VenueStatus.PENDING);

        return toResponse(venueRepository.save(venue));
    }

    @Override
    public VenueResponse updateVenueById(VenueRequest request, UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("ID non può essere null");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request non può essere null");
        }

        Venue existing = findEntityById(id);
        User currentUser = currentUserService.getCurrentUser();

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isOwnerOfVenue = existing.getOwner().getId().equals(currentUser.getId());

        if (!isAdmin && !isOwnerOfVenue) {
            throw new AccessDeniedException("Non puoi modificare questo locale");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            existing.setName(request.getName());
        }
        if (request.getDescription() != null) {
            existing.setDescription(request.getDescription());
        }
        boolean shouldUpdateCoordinates = false;

        if (request.getCity() != null && !request.getCity().isBlank()
                && !request.getCity().equalsIgnoreCase(existing.getCity())) {
            existing.setCity(request.getCity());
            shouldUpdateCoordinates = true;
        }
        if (request.getAddress() != null && !request.getAddress().isBlank()
                && !request.getAddress().equalsIgnoreCase(existing.getAddress())) {
            existing.setAddress(request.getAddress());
            shouldUpdateCoordinates = true;
        }
        if (request.getType() != null) {
            existing.setType(request.getType());
        }
        if (request.getImageUri() != null) {
            existing.setImageUri(request.getImageUri());
        }

        if (shouldUpdateCoordinates) {
            Coordinates coordinates = geocodingService.geocode(toFullAddress(existing.getAddress(), existing.getCity()));
            existing.setLatitude(coordinates.latitude());
            existing.setLongitude(coordinates.longitude());
        }

        return toResponse(venueRepository.save(existing));
    }

    @Override
    public VenueResponse updateVenueStatus(UUID id, VenueStatus status) {
        if (id == null) {
            throw new IllegalArgumentException("ID non può essere null");
        }
        if (status == null) {
            throw new IllegalArgumentException("Status non può essere null");
        }

        User currentUser = currentUserService.getCurrentUser();

        if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Solo un admin può modificare lo status del locale");
        }

        Venue venue = findEntityById(id);
        venue.setStatus(status);

        return toResponse(venueRepository.save(venue));
    }

    @Override
    public VenueResponse activateVenue(UUID id) {
        return updateVenueStatus(id, VenueStatus.ACTIVE);
    }

    @Override
    public VenueResponse suspendVenue(UUID id) {
        return updateVenueStatus(id, VenueStatus.SUSPENDED);
    }

    @Override
    public void deleteVenueById(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("ID non può essere null");
        }

        Venue venue = findEntityById(id);
        User currentUser = currentUserService.getCurrentUser();

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isOwnerOfVenue = venue.getOwner().getId().equals(currentUser.getId());

        if (!isAdmin && !isOwnerOfVenue) {
            throw new AccessDeniedException("Non puoi eliminare questo locale");
        }

        venueDrinkRepository.deleteAllByVenueId(id);
        venueReviewRepository.deleteAllByVenueId(id);
        favoriteVenueRepository.deleteAllByVenueId(id);
        venueRepository.delete(venue);
    }

    // -------------------------
    // Private helpers
    // -------------------------

    private Venue findEntityById(UUID id) {
        return venueRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Venue non trovato con ID: " + id));
    }

    private Venue toEntity(VenueRequest request) {
        return Venue.builder()
                .name(request.getName())
                .description(request.getDescription())
                .city(request.getCity())
                .address(request.getAddress())
                .type(request.getType())
                .imageUri(request.getImageUri())
                .build();
    }

    private String toFullAddress(String address, String city) {
        return address + ", " + city + ", Italy";
    }

    private VenueResponse toResponse(Venue venue) {
        String ownerUsername = null;
        try {
            if (venue.getOwner() != null) {
                ownerUsername = venue.getOwner().getUsername();
            }
        } catch (Exception ignored) {
            // LazyInitializationException o owner non disponibile
        }
        return VenueResponse.builder()
                .id(venue.getId())
                .name(venue.getName())
                .description(venue.getDescription())
                .city(venue.getCity())
                .address(venue.getAddress())
                .latitude(venue.getLatitude())
                .longitude(venue.getLongitude())
                .type(venue.getType())
                .status(venue.getStatus())
                .createdAt(venue.getCreatedAt())
                .ownerUsername(ownerUsername)
                .imageUri(venue.getImageUri())
                .build();
    }


}

