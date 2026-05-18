package com.project.localbrew.service;

import java.util.List;
import java.util.UUID;

import com.project.localbrew.entity.Venue;

public interface VenueService {
	List<Venue> findAllVenues();
	Venue findVenueById(UUID id);
	Venue saveVenue(Venue venue);
}
