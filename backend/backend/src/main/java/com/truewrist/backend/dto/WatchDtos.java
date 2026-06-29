package com.truewrist.backend.dto;

import com.truewrist.backend.domain.ArReviewStatus;
import com.truewrist.backend.domain.ListingStatus;
import com.truewrist.backend.domain.Watch;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
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
            long arTryCount,
            ListingStatus status,
            ArReviewStatus arReviewStatus,
            String arReviewNote,
            String shopId,
            long createdAt) {

        public static WatchResponse from(Watch w) {
            ArReviewStatus arStatus = w.getArReviewStatus() == null
                    ? ArReviewStatus.PENDING
                    : w.getArReviewStatus();
            return new WatchResponse(
                    w.getId(), w.getName(), w.getBrand(), w.getPrice(), w.getOriginalPrice(),
                    w.getDescription(), w.getSpecs(), w.getImage(), w.getGallery(),
                    w.getModelUrl(), w.isHasAR(), w.getArWatchId(), w.getVariant(),
                    w.getMetal(), w.getDial(), w.getAccent(), w.getRating(), w.getReviewCount(),
                    w.getArTryCount(), w.getStatus(), arStatus, w.getArReviewNote(),
                    w.getShopId(), w.getCreatedAt());
        }
    }

    /** Admin moderation decision for a watch's AR/3D model. */
    public record ArReviewRequest(
            @NotNull ArReviewStatus status,
            String note) {}

    public record WatchRequest(
            @NotBlank String name,
            @NotBlank String brand,
            @PositiveOrZero @Max(value = 1_000_000_000, message = "Giá bán không được vượt quá 1 tỷ VND.") long price,
            @Max(value = 1_000_000_000, message = "Giá niêm yết không được vượt quá 1 tỷ VND.") Long originalPrice,
            String description,
            Map<String, String> specs,
            @NotBlank String image,
            @Size(max = 10, message = "Mỗi sản phẩm chỉ được có tối đa 10 ảnh.")
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
            /** Required for admins; sellers may select any shop they own. */
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
