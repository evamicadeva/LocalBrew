package com.project.localbrew.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.project.localbrew.entity.Venue;
import com.project.localbrew.repository.VenueRepository;

public class VenueServiceImpl implements VenueService {
	private final VenueRepository venueRepository;

	public VenueServiceImpl(VenueRepository venueRepository) {
		this.venueRepository = venueRepository;
	}

	@Override
	public List<Venue> findAllVenues() {
		return venueRepository.findAll();
	}

	@Override
	public Venue findVenueById(UUID id) {
		if(id == null) {
			// Mettere eccezione personalizzata per id non trovato
		}
		Optional<Venue> optVenue = venueRepository.findById(id);
		return optVenue.orElseThrow(() -> new Exception());// mettere eccezione personalizzata per Venue non trovato con quel id
	}

	@Override
	public Venue saveVenue(Venue venue) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Venue updateVenueById(UUID id) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void deleteVenue(UUID id) {
		// TODO Auto-generated method stub

	}

}
