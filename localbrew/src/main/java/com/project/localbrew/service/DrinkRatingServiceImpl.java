package com.project.localbrew.service;

import com.project.localbrew.entity.Drink;
import com.project.localbrew.entity.DrinkRating;
import com.project.localbrew.entity.User;
import com.project.localbrew.repository.DrinkRatingRepository;
import com.project.localbrew.repository.DrinkRepository;
import com.project.localbrew.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

// TODO
// creare eccezioni personalizzate

@Service
public class DrinkRatingServiceImpl implements DrinkRatingService {
    DrinkRatingRepository drinkRatingRepository;
    UserRepository userRepository;
    DrinkRepository drinkRepository;

    public DrinkRatingServiceImpl(DrinkRatingRepository drinkRatingRepository, UserRepository userRepository, DrinkRepository drinkRepository) {
        this.drinkRatingRepository = drinkRatingRepository;
        this.userRepository = userRepository;
        this.drinkRepository = drinkRepository;
    }

    @Override
    public DrinkRating saveDrinkRating(DrinkRating drinkRating) {
        if (drinkRating == null) {
            throw new IllegalArgumentException("drinkRating nullo");
        }

        return drinkRatingRepository.save(drinkRating);
    }

    @Override
    public List<DrinkRating> findAllDrinkRating() {
        return drinkRatingRepository.findAll();
    }

    @Override
    public DrinkRating findDrinkRatingById(UUID id) {
        return drinkRatingRepository.findById(id).
                orElseThrow(() -> new EntityNotFoundException("DrinkRating non trovato con id: " + id));
    }

    @Override
    @Transactional
    public DrinkRating updateDrinkRatingById(DrinkRating drinkRating, UUID id) {
        if (drinkRating == null) {
            throw new IllegalArgumentException("DrinkRating nullo");
        }
        if (id == null) {
            throw new IllegalArgumentException("Id nullo");
        }

        DrinkRating savedDrinkRating = drinkRatingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("DrankRating non trovato con id: " + id));

        if (drinkRating.getUser() != null) {
            User user = findUserInsideDrinkRating(drinkRating);
            savedDrinkRating.setUser(user);
        }

        if (drinkRating.getDrink() != null) {
            Drink drink = findDrinkInsideDrinkRating(drinkRating);
            savedDrinkRating.setDrink(drink);
        }

        if (drinkRating.getRating() != null) {
            savedDrinkRating.setRating(drinkRating.getRating());
        }

        return drinkRatingRepository.save(savedDrinkRating);
    }

    @Override
    @Transactional
    public DrinkRating replaceDrinkRatingById(DrinkRating drinkRating, UUID id) {
        if (drinkRating == null) {
            throw new IllegalArgumentException("DrinkRating nullo");
        }

        if (id == null) {
            throw new IllegalArgumentException("Id nullo");
        }

        DrinkRating savedDrinkRating = drinkRatingRepository.findById(drinkRating.getId()).orElseThrow(() -> new EntityNotFoundException("DrinkRating non trovato con id: " + id));


        User user = findUserInsideDrinkRating(drinkRating);
        Drink drink = findDrinkInsideDrinkRating(drinkRating);

        savedDrinkRating.setUser(user);
        savedDrinkRating.setDrink(drink);
        savedDrinkRating.setRating(drinkRating.getRating());

        return drinkRatingRepository.save(savedDrinkRating);
    }

    @Override
    @Transactional
    public void deleteDrinkRatingById(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("Id nullo");
        }

        DrinkRating savedDrinkRating = drinkRatingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("DrinkRating non trovato con id: " + id));

        drinkRatingRepository.delete(savedDrinkRating);
    }

    private Drink findDrinkInsideDrinkRating(DrinkRating drinkRating) {
        return drinkRepository.findById(drinkRating.getDrink().getId()).orElseThrow(() -> new EntityNotFoundException("DrinkRating non trovato con id: " + drinkRating.getDrink().getId()));
    }

    private User findUserInsideDrinkRating(DrinkRating drinkRating) {
        return userRepository.findById(drinkRating.getUser().getId()).orElseThrow(() -> new EntityNotFoundException("DrinkRating non trovato con id: " + drinkRating.getUser().getId()));
    }
}