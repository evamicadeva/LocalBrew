package com.project.localbrew.controller;

import com.project.localbrew.service.ImageUploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/owner/images")
public class ImageUploadController {

    private final ImageUploadService imageUploadService;

    public ImageUploadController(ImageUploadService imageUploadService) {
        this.imageUploadService = imageUploadService;
    }

    @PostMapping("/venue")
    public ResponseEntity<Map<String, String>> uploadVenueImage(
            @RequestParam("file") MultipartFile file
    ) {
        String url = imageUploadService.uploadVenueImage(file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping("/drink")
    public ResponseEntity<Map<String, String>> uploadDrinkImage(
            @RequestParam("file") MultipartFile file
    ) {
        String url = imageUploadService.uploadDrinkImage(file);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
