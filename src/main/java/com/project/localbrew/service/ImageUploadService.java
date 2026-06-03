package com.project.localbrew.service;

import org.springframework.web.multipart.MultipartFile;

public interface ImageUploadService {
    String uploadVenueImage(MultipartFile file);
    String uploadDrinkImage(MultipartFile file);
}
