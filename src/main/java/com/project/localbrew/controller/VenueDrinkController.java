package com.project.localbrew.controller;

import com.project.localbrew.dto.request.VenueDrinkRequest;
import com.project.localbrew.dto.response.VenueDrinkResponse;
import com.project.localbrew.service.VenueDrinkService;
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
public class VenueDrinkController {

    private final VenueDrinkService venueDrinkService;

    public VenueDrinkController(VenueDrinkService venueDrinkService) {
        this.venueDrinkService = venueDrinkService;
    }

    @GetMapping("/public/venues/{venueId}/drinks")
    public ResponseEntity<List<VenueDrinkResponse>> findVenueDrinks(
            @PathVariable @NotNull(message = "Venue ID non puo essere nullo") UUID venueId
    ) {
        return ResponseEntity.ok(venueDrinkService.findAllByVenueId(venueId));
    }

    @GetMapping("/owner/venues/{venueId}/drinks")
    public ResponseEntity<List<VenueDrinkResponse>> findManageableVenueDrinks(
            @PathVariable @NotNull(message = "Venue ID non puo essere nullo") UUID venueId
    ) {
        return ResponseEntity.ok(venueDrinkService.findAllByManageableVenueId(venueId));
    }

    @PostMapping("/owner/venues/{venueId}/drinks")
    public ResponseEntity<VenueDrinkResponse> addDrinkToVenue(
            @PathVariable @NotNull(message = "Venue ID non puo essere nullo") UUID venueId,
            @Valid @RequestBody VenueDrinkRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(venueDrinkService.addDrinkToVenue(venueId, request));
    }

    @PutMapping("/owner/venues/{venueId}/drinks/{drinkId}")
    public ResponseEntity<VenueDrinkResponse> updateVenueDrink(
            @PathVariable @NotNull(message = "Venue ID non puo essere nullo") UUID venueId,
            @PathVariable @NotNull(message = "Drink ID non puo essere nullo") UUID drinkId,
            @Valid @RequestBody VenueDrinkRequest request
    ) {
        return ResponseEntity.ok(venueDrinkService.updateVenueDrink(venueId, drinkId, request));
    }

    @DeleteMapping("/owner/venues/{venueId}/drinks/{drinkId}")
    public ResponseEntity<Void> removeDrinkFromVenue(
            @PathVariable @NotNull(message = "Venue ID non puo essere nullo") UUID venueId,
            @PathVariable @NotNull(message = "Drink ID non puo essere nullo") UUID drinkId
    ) {
        venueDrinkService.removeDrinkFromVenue(venueId, drinkId);
        return ResponseEntity.noContent().build();
    }
}
