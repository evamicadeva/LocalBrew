package com.project.localbrew.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


import com.project.localbrew.entity.User;
import com.project.localbrew.entity.Venue;
import com.project.localbrew.repository.UserRepository;
import com.project.localbrew.repository.VenueRepository;

import jakarta.transaction.Transactional;

public class VenueServiceImpl implements VenueService {
	private final VenueRepository venueRepository;
	private final UserRepository userRepository;

	public VenueServiceImpl(VenueRepository venueRepository, UserRepository userRepository) {
		this.venueRepository = venueRepository;
		this.userRepository = userRepository;
	}

	@Override
	public List<Venue> findAllVenues() {
		return venueRepository.findAll();
	}

	@Override
	public Venue findVenueById(UUID id) {
		if (id == null) {
			// Mettere eccezione personalizzata per id non trovato
		}
		Optional<Venue> optVenue = venueRepository.findById(id);
		return optVenue.orElseThrow(() -> new Exception());// mettere eccezione personalizzata per Venue non trovato con
															// quel id
	}

	@Transactional
	@Override
	public Venue saveVenue(Venue venue) {
		if (venue == null) {
			// eccezione personalizzata per venue = null
		}
		
		// Cercare lo user
		User user = findUserInsideVenue(venue);
		venue.setOwner(user);
		
		return venueRepository.save(venue);
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

	// metodi privati
	// validazione
	// serve per controllare se lo user esiste
	private User findUserInsideVenue(Venue venue) { 
		return userRepository.findById(venue.getOwner().getId())
				.orElseThrow(() -> new IllegalArgumentException("User non trovato con id:" + venue.getOwner().getId()));
	}// cambiare illegal exceptio con una personalizzata
}
