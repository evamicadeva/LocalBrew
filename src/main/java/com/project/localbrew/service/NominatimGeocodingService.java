package com.project.localbrew.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
public class NominatimGeocodingService implements GeocodingService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String baseUrl;
    private final String userAgent;

    public NominatimGeocodingService(
            @Value("${geocoding.nominatim.url:https://nominatim.openstreetmap.org/search}") String baseUrl,
            @Value("${geocoding.user-agent:LocalBrew/1.0}") String userAgent
    ) {
        this.baseUrl = baseUrl;
        this.userAgent = userAgent;
    }

    @Override
    public Coordinates geocode(String address) {
        if (address == null || address.isBlank()) {
            throw new IllegalArgumentException("Indirizzo non valido per il geocoding");
        }

        String encodedAddress = URLEncoder.encode(address, StandardCharsets.UTF_8);
        URI uri = URI.create(baseUrl + "?format=json&limit=1&countrycodes=it&q=" + encodedAddress);

        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(10))
                .header("Accept", "application/json")
                .header("User-Agent", userAgent)
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalArgumentException("Impossibile recuperare le coordinate dell'indirizzo");
            }

            JsonNode results = objectMapper.readTree(response.body());
            if (!results.isArray() || results.isEmpty()) {
                throw new IllegalArgumentException("Coordinate non trovate per l'indirizzo inserito");
            }

            JsonNode firstResult = results.get(0);
            return new Coordinates(
                    firstResult.get("lat").asDouble(),
                    firstResult.get("lon").asDouble()
            );
        } catch (IOException ex) {
            throw new IllegalArgumentException("Errore durante la ricerca delle coordinate", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalArgumentException("Ricerca coordinate interrotta", ex);
        }
    }
}
