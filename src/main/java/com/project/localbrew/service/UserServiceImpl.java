package com.project.localbrew.service;

import com.project.localbrew.dto.request.UserUpdateRequest;
import com.project.localbrew.dto.response.UserResponse;
import com.project.localbrew.entity.Role;
import com.project.localbrew.entity.User;
import com.project.localbrew.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User findById(UUID id) {

        if (id == null) {
            throw new IllegalArgumentException("ID non può essere null");
        }

        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Utente non trovato con ID: " + id));
    }

    @Override
    public User findByEmail(String email) {

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email non può essere vuota");
        }

        return userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));
    }

    @Override
    public User findByUsername(String username) {

        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username non può essere vuoto");
        }

        return userRepository.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));
    }

    @Transactional
    @Override
    public User saveUser(User user) {

        if (user == null) {
            throw new IllegalArgumentException("Utente non può essere null");
        }

        if (user.getUsername() == null || user.getUsername().isBlank()) {

            throw new IllegalArgumentException("Username non può essere vuoto");
        }

        if (user.getEmail() == null || user.getEmail().isBlank()) {

            throw new IllegalArgumentException("Email non può essere vuota");
        }

        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {

            throw new IllegalArgumentException("Password non può essere vuota");
        }

        if (user.getRole() == null) {
            throw new IllegalArgumentException("Role non può essere null");
        }

        // Username unico
        Optional<User> existingUsername = userRepository.findByUsername(user.getUsername());

        if (existingUsername.isPresent()) {
            throw new IllegalArgumentException("Username già esistente: " + user.getUsername());
        }

        // Email unica
        Optional<User> existingEmail = userRepository.findByEmail(user.getEmail());

        if (existingEmail.isPresent()) {
            throw new IllegalArgumentException("Email già esistente: " + user.getEmail());
        }

        // Encode password
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));

        return userRepository.save(user);
    }

    @Override
    public User updateUser(UUID id, UserUpdateRequest request) {

        User existingUser = findById(id);

        // Username
        if (request.getUsername() != null && !request.getUsername().isBlank()) {

            Optional<User> userWithUsername = userRepository.findByUsername(request.getUsername());

            if (userWithUsername.isPresent() && !userWithUsername.get().getId().equals(id)) {

                throw new IllegalArgumentException("Username già esistente");
            }

            existingUser.setUsername(request.getUsername());
        }

        // Email
        if (request.getEmail() != null && !request.getEmail().isBlank()) {

            Optional<User> userWithEmail = userRepository.findByEmail(request.getEmail());

            if (userWithEmail.isPresent() && !userWithEmail.get().getId().equals(id)) {

                throw new IllegalArgumentException("Email già esistente");
            }

            existingUser.setEmail(request.getEmail());
        }

        // Password
        if (request.getPassword() != null && !request.getPassword().isBlank()) {

            existingUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        return userRepository.save(existingUser);
    }

    @Override
    public UserResponse updateUserRole(UUID id, Role role) {
        if (role == null) {
            throw new IllegalArgumentException("Role non puo essere null");
        }
        if (role == Role.ADMIN) {
            throw new IllegalArgumentException("Non puoi assegnare il ruolo admin da questo endpoint");
        }

        User existingUser = findById(id);
        existingUser.setRole(role);

        return toResponse(userRepository.save(existingUser));
    }

    @Override
    public void deleteUserById(UUID id) {

        User userToDelete = findById(id);

        userRepository.delete(userToDelete);
    }

    @Override
    public UserResponse getCurrentUser(String email) {

        User user = findByEmail(email);

        return toResponse(user);
    }

    @Override
    public UserResponse toResponse(User user) {
        if (user == null) {
            throw new IllegalArgumentException("Utente non puo essere null");
        }

        return UserResponse.builder().id(user.getId()).username(user.getUsername()).email(user.getEmail()).role(user.getRole()).createdAt(user.getCreatedAt()).build();
    }
}
