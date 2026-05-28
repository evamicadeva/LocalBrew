package com.project.localbrew.service;

import com.project.localbrew.dto.request.DrinkRequest;
import com.project.localbrew.dto.response.DrinkResponse;
import com.project.localbrew.entity.Drink;
import com.project.localbrew.entity.DrinkCategory;
import com.project.localbrew.exception.DrinkNotFoundException;
import com.project.localbrew.repository.DrinkRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class DrinkServiceImpl implements DrinkService {

    private final DrinkRepository drinkRepository;

    public DrinkServiceImpl(DrinkRepository drinkRepository) {
        this.drinkRepository = drinkRepository;
    }

    @Override
    public List<DrinkResponse> findDrinks(List<DrinkCategory> categories, String name) {
        List<Drink> drinks;

        if (name != null && !name.isBlank()) {
            drinks = drinkRepository.findByNameContainingIgnoreCase(name);
        } else if (categories != null && !categories.isEmpty()) {
            drinks = drinkRepository.findByCategoryIn(categories);
        } else {
            drinks = drinkRepository.findAll();
        }

        return drinks.stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public Drink findDrinkById(UUID id) {
        validateId(id);

        return drinkRepository.findById(id)
                .orElseThrow(() -> new DrinkNotFoundException("Drink non trovato con ID: " + id));
    }

    @Override
    public DrinkResponse saveDrink(DrinkRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request non puo essere null");
        }

        Drink drink = toEntity(request);

        return toResponse(drinkRepository.save(drink));
    }

    @Override
    public DrinkResponse updateDrinkById(UUID id, DrinkRequest request) {
        validateId(id);
        if (request == null) {
            throw new IllegalArgumentException("Request non puo essere null");
        }

        Drink existingDrink = findDrinkById(id);

        if (request.getName() != null && !request.getName().isBlank()) {
            existingDrink.setName(request.getName());
        }
        if (request.getDescription() != null) {
            existingDrink.setDescription(request.getDescription());
        }
        if (request.getCategory() != null) {
            existingDrink.setCategory(request.getCategory());
        }
        if (request.getAbv() != null) {
            existingDrink.setAbv(request.getAbv());
        }
        if (request.getOrigin() != null) {
            existingDrink.setOrigin(request.getOrigin());
        }
        if (request.getImageUri() != null) {
            existingDrink.setImageUri(request.getImageUri());
        }

        return toResponse(drinkRepository.save(existingDrink));
    }

    @Override
    public void deleteDrinkById(UUID id) {
        validateId(id);

        Drink drink = findDrinkById(id);
        drinkRepository.delete(drink);
    }

    private void validateId(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("ID non puo essere null");
        }
    }

    private Drink toEntity(DrinkRequest request) {
        return Drink.builder()
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .abv(request.getAbv())
                .origin(request.getOrigin())
                .imageUri(request.getImageUri())
                .build();
    }

    private DrinkResponse toResponse(Drink drink) {
        return DrinkResponse.builder()
                .id(drink.getId())
                .name(drink.getName())
                .description(drink.getDescription())
                .category(drink.getCategory())
                .abv(drink.getAbv())
                .origin(drink.getOrigin())
                .imageUri(drink.getImageUri())
                .build();
    }
}
