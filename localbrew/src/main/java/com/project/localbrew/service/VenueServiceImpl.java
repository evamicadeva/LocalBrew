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
		
		// mettere eccezione personalizzata per Venue non trovato con quel id
		return optVenue.orElseThrow(() -> new Exception());
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

	@Transactional
	@Override
	public Venue updateVenueById(Venue venue , UUID id) {
		if (id == null) {
			// Mettere eccezione personalizzata per id non trovato
		}
		if (venue == null) {
			// eccezione personalizzata per venue = null
		}
		
		//verifica se esiste la Venue
		//cambiare exception con un eccezione personalizata
		Venue nwVenue = venueRepository.findById(id).orElsethrow(() -> new IllegalArgumentException());
		
		//controlli
		if(venue.getName() != null && !venue.getName().isBlank())
			nwVenue.setName(venue.getName());
		if(venue.getAdress() != null && !venue.getAdress().isBlank())
			nwVenue.setAdress(venue.getAdress());
		if(venue.getLatitude() != null)
			nwVenue.setLatitude(venue.getLatitude());
		if(venue.getLongitude() != null)
			nwVenue.setLongitude(venue.getLongitude());
		if(venue.getType() != null)
			nwVenue.setType(venue.getType());
		if(venue.getStatus() != null)
			nwVenue.setStatus(venue.getStatus());
		if(venue.getCreatedAt() != null)
			nwVenue.setCreatedAt(venue.getCreatedAt());
		if(venue.getOwner() != null) {
			User user = findUserInsideVenue(venue);
			nwVenue.setOwner(user);
		}
		
		return nwVenue;
	}

	@Transactional
	@Override
	public void deleteVenueById(UUID id) {
		if (id == null) {
			// Mettere eccezione personalizzata per id non trovato
		}
		
		//cambiare exception con un eccezione personalizata
		Venue delVenue = venueRepository.findById(id).orElsethrow(() -> new IllegalArgumentException());
		venueRepository.delete(delVenue);
	}

	// metodi privati
	// validazione
	// serve per controllare se lo user esiste
	private User findUserInsideVenue(Venue venue) { 
		return userRepository.findById(venue.getOwner().getId())
				.orElseThrow(() -> new IllegalArgumentException("User non trovato con id:" + venue.getOwner().getId()));
	}// cambiare illegal exception con una personalizzata
}
