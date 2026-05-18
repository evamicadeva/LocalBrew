package com.project.localbrew.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.localbrew.entity.FavoriteDrink;

@Repository
public interface FavoriteDrinkRepository extends JpaRepository<FavoriteDrink, UUID> {

}
