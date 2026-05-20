package com.project.localbrew.service;

import com.project.localbrew.entity.VenueDrink;

import java.util.List;
import java.util.UUID;

public interface VenueDrinkService {
    // CRUD
    List<VenueDrink> findAllVenueDrinks();

    VenueDrink findVenueDrinkById(UUID id);

    VenueDrink saveVenueDrink(VenueDrink drink);

    VenueDrink updateVenueDrinkById(UUID id, VenueDrink drink);

    void deleteVenueDrinkById(UUID id);
}
