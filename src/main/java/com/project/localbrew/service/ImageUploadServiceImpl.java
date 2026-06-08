package com.project.localbrew.service;

import com.project.localbrew.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class ImageUploadServiceImpl implements ImageUploadService {

    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    @Value("${upload.base-path}")
    private String basePath;

    @Override
    public String uploadVenueImage(MultipartFile file) {
        return save(file, "venues");
    }

    @Override
    public String uploadDrinkImage(MultipartFile file) {
        return save(file, "drinks");
    }

    private String save(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File non fornito");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Formato non supportato. Usa JPG, PNG o WEBP");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new BadRequestException("File troppo grande. Massimo 5 MB");
        }

        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "img";
        String ext = original.contains(".")
                ? original.substring(original.lastIndexOf('.'))
                : ".jpg";
        String filename = UUID.randomUUID() + ext;

        try {
            Path dir = Paths.get(basePath, subfolder);
            Files.createDirectories(dir);
            file.transferTo(dir.resolve(filename));
        } catch (IOException e) {
            throw new BadRequestException("Errore durante il salvataggio del file");
        }

        return "/uploads/" + subfolder + "/" + filename;
    }
}
