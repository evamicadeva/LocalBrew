package com.project.localbrew.service;

import com.project.localbrew.entity.DrinkRating;

import java.util.List;
import java.util.UUID;

public interface DrinkRatingService {
    DrinkRating saveDrinkRating(DrinkRating drinkRating);

    List<DrinkRating> findAllDrinkRating();

    DrinkRating findDrinkRatingById(UUID id);

    DrinkRating updateDrinkRatingById(DrinkRating drinkRating, UUID id);

    DrinkRating replaceDrinkRatingById(DrinkRating drinkRating, UUID id);

    void deleteDrinkRatingById(UUID id);
}
