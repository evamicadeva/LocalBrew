package com.project.localbrew.service;

import com.project.localbrew.dto.request.VenueDrinkRequest;
import com.project.localbrew.dto.response.VenueDrinkResponse;

import java.util.List;
import java.util.UUID;

public interface VenueDrinkService {

    List<VenueDrinkResponse> findAllByVenueId(UUID venueId);

    List<VenueDrinkResponse> findAllByManageableVenueId(UUID venueId);

    VenueDrinkResponse addDrinkToVenue(UUID venueId, VenueDrinkRequest request);

    VenueDrinkResponse updateVenueDrink(UUID venueId, UUID drinkId, VenueDrinkRequest request);

    void removeDrinkFromVenue(UUID venueId, UUID drinkId);
}
