package com.project.localbrew.service;

import java.util.List;
import java.util.UUID;

import com.project.localbrew.entity.Venue;

public interface VenueService {
	// Crud
	List<Venue> findAllVenues();
	Venue findVenueById(UUID id);
	Venue saveVenue(Venue venue);
	Venue updateVenueById(Venue venue, UUID id);
	void deleteVenueById(UUID id);
}
