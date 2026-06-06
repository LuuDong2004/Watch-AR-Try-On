package com.truewrist.backend.dto;

import com.truewrist.backend.domain.ListingStatus;
import com.truewrist.backend.domain.Watch;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Request/response payloads for watches. */
public final class WatchDtos {

    private WatchDtos() {}

    public record WatchResponse(
            String id,
            String name,
            String brand,
            long price,
            Long originalPrice,
            String description,
            Map<String, String> specs,
            String image,
            List<String> gallery,
            String modelUrl,
            boolean hasAR,
            String arWatchId,
            String variant,
            String metal,
            String dial,
            String accent,
            double rating,
            int reviewCount,
            ListingStatus status,
            String shopId,
            long createdAt) {

        public static WatchResponse from(Watch w) {
            return new WatchResponse(
                    w.getId(), w.getName(), w.getBrand(), w.getPrice(), w.getOriginalPrice(),
                    w.getDescription(), w.getSpecs(), w.getImage(), w.getGallery(),
                    w.getModelUrl(), w.isHasAR(), w.getArWatchId(), w.getVariant(),
                    w.getMetal(), w.getDial(), w.getAccent(), w.getRating(), w.getReviewCount(),
                    w.getStatus(), w.getShopId(), w.getCreatedAt());
        }
    }

    public record WatchRequest(
            @NotBlank String name,
            @NotBlank String brand,
            @PositiveOrZero long price,
            Long originalPrice,
            String description,
            Map<String, String> specs,
            String image,
            List<String> gallery,
            String modelUrl,
            Boolean hasAR,
            @NotBlank String arWatchId,
            String variant,
            String metal,
            String dial,
            String accent,
            Double rating,
            Integer reviewCount,
            ListingStatus status,
            /** Required for admins; shops always use their own shop. */
            String shopId) {

        public Map<String, String> specsOrEmpty() {
            return specs == null ? new LinkedHashMap<>() : new LinkedHashMap<>(specs);
        }

        public List<String> galleryOrEmpty() {
            return gallery == null ? new ArrayList<>() : new ArrayList<>(gallery);
        }

        public boolean hasArOrDefault() {
            return hasAR != null && hasAR;
        }

        public double ratingOrZero() {
            return rating == null ? 0 : rating;
        }

        public int reviewCountOrZero() {
            return reviewCount == null ? 0 : reviewCount;
        }

        public ListingStatus statusOrActive() {
            return status == null ? ListingStatus.ACTIVE : status;
        }
    }
}
