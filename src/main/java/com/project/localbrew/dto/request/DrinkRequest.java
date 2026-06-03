package com.project.localbrew.dto.request;

import com.project.localbrew.entity.DrinkCategory;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrinkRequest {

    @NotBlank(message = "Nome obbligatorio")
    @Size(max = 100, message = "Nome massimo 100 caratteri")
    private String name;

    @Size(max = 300, message = "Descrizione troppo lunga")
    private String description;

    @NotNull(message = "Categoria obbligatoria")
    private DrinkCategory category;

    @DecimalMin(value = "0.0", message = "ABV minimo 0")
    @DecimalMax(value = "100.0", message = "ABV massimo 100")
    private Double abv;

    @Size(max = 100, message = "Origine massimo 100 caratteri")
    private String origin;

    @Size(max = 500)
    private String imageUri;
}
