package com.project.localbrew.dto.request;

import com.project.localbrew.entity.VenueType;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VenueRequest {

    @NotBlank(message = "Il nome e obbligatorio")
    @Size(max = 50, message = "Il nome non puo superare 50 caratteri")
    private String name;

    @Size(max = 500, message = "La descrizione non puo superare 500 caratteri")
    private String description;

    @NotBlank(message = "La città e obbligatoria")
    @Size(max = 50, message = "La città non puo superare i 50 caratteri")
    private String city;

    @NotBlank(message = "L'indirizzo e obbligatorio")
    @Size(max = 70, message = "L'indirizzo non puo superare 70 caratteri")
    private String address;

    @NotNull(message = "Il tipo e obbligatorio")
    private VenueType type;

    @DecimalMin(value = "-90.0", message = "Latitudine minima -90")
    @DecimalMax(value = "90.0", message = "Latitudine massima 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitudine minima -180")
    @DecimalMax(value = "180.0", message = "Longitudine massima 180")
    private Double longitude;

    @Size(max = 500)
    private String imageUri;
}
