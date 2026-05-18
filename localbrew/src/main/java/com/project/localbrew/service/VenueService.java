package com.project.localbrew.service;

import java.util.List;

import com.project.localbrew.entity.Venue;

public interface VenueService {
	List<Venue> findAllVenues();
	Venue findVenueByUUID();
	
}
