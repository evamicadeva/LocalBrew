package com.project.localbrew.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VenueReviewRequest {

    private UUID venueId;

    @NotNull(message = "Rating obbligatorio")
    @Min(value = 1, message = "Rating minimo 1")
    @Max(value = 5, message = "Rating massimo 5")
    private Integer rating;

    @Size(max = 500, message = "Commento massimo 500 caratteri")
    private String comment;
}
