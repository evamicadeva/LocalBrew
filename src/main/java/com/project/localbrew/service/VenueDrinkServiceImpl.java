package com.project.localbrew.service;

import com.project.localbrew.entity.VenueDrink;
import com.project.localbrew.repository.VenueDrinkRepository;
import com.project.localbrew.service.VenueDrinkService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class VenueDrinkServiceImpl implements VenueDrinkService {

    private final VenueDrinkRepository venueDrinkRepository;

    public VenueDrinkServiceImpl(VenueDrinkRepository venueDrinkRepository) {
        this.venueDrinkRepository = venueDrinkRepository;
    }

    @Override
    public List<VenueDrink> findAllVenueDrinks() {
        return venueDrinkRepository.findAll();
    }

    @Override
    public VenueDrink findVenueDrinkById(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("L'ID non può essere nullo");
        }

        return venueDrinkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("VenueDrink non trovato con id: " + id));
    }

    @Override
    public VenueDrink saveVenueDrink(VenueDrink drink) {
        validateVenueDrink(drink);

        // Controllo duplicati: venue + drink unici
        boolean exists = venueDrinkRepository.existsByVenueIdAndDrinkId(
                drink.getVenue().getId(),
                drink.getDrink().getId()
        );

        if (exists) {
            throw new RuntimeException("Questo locale ha già assegnato questo drink");
        }

        return venueDrinkRepository.save(drink);
    }

    @Override
    public VenueDrink updateVenueDrinkById(VenueDrink drink, UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("L'ID non può essere nullo");
        }

        validateVenueDrink(drink);

        VenueDrink existing = findVenueDrinkById(id);

        // Controllo duplicati SOLO se venue o drink cambiano
        boolean isChangingPair =
                !existing.getVenue().getId().equals(drink.getVenue().getId()) ||
                        !existing.getDrink().getId().equals(drink.getDrink().getId());

        if (isChangingPair) {
            boolean exists = venueDrinkRepository.existsByVenueIdAndDrinkId(
                    drink.getVenue().getId(),
                    drink.getDrink().getId()
            );

            if (exists) {
                throw new RuntimeException("Questo locale ha già assegnato questo drink");
            }
        }

        existing.setPrice(drink.getPrice());
        existing.setVenue(drink.getVenue());
        existing.setDrink(drink.getDrink());

        return venueDrinkRepository.save(existing);
    }

    @Override
    public void deleteVenueDrinkById(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("L'ID non può essere nullo");
        }

        if (!venueDrinkRepository.existsById(id)) {
            throw new RuntimeException("Impossibile eliminare: nessun VenueDrink trovato con ID: " + id);
        }

        venueDrinkRepository.deleteById(id);
    }


    // VALIDAZIONE INTERNA

    private void validateVenueDrink(VenueDrink drink) {
        if (drink == null) {
            throw new IllegalArgumentException("VenueDrink non può essere nullo");
        }
        if (drink.getVenue() == null || drink.getVenue().getId() == null) {
            throw new IllegalArgumentException("Venue non può essere nullo");
        }
        if (drink.getDrink() == null || drink.getDrink().getId() == null) {
            throw new IllegalArgumentException("Drink non può essere nullo");
        }
        if (drink.getPrice() == null || drink.getPrice().doubleValue() < 0) {
            throw new IllegalArgumentException("Il prezzo deve essere un valore positivo");
        }
    }
}
