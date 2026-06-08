package com.truewrist.backend.dto;

import com.truewrist.backend.domain.ListingStatus;
import com.truewrist.backend.domain.Shop;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

/** Request/response payloads for shops. */
public final class ShopDtos {

    private ShopDtos() {}

    public record ShopResponse(
            String id,
            String ownerId,
            String name,
            String phone,
            String email,
            String address,
            String description,
            String color,
            String zalo,
            String messenger,
            String hours,
            String manager,
            String image,
            String mapUrl,
            List<String> services,
            double rating,
            int reviewCount,
            String since,
            ListingStatus status,
            String lockReason,
            long createdAt) {

        public static ShopResponse from(Shop s) {
            return new ShopResponse(
                    s.getId(), s.getOwnerId(), s.getName(), s.getPhone(), s.getEmail(), s.getAddress(),
                    s.getDescription(), s.getColor(), s.getZalo(), s.getMessenger(),
                    s.getHours(), s.getManager(), s.getImage(), s.getMapUrl(), s.getServices(),
                    s.getRating(), s.getReviewCount(), s.getSince(), s.getStatus(),
                    s.getLockReason(), s.getCreatedAt());
        }
    }

    public record ShopRequest(
            @NotBlank String name,
            String phone,
            String email,
            String address,
            String description,
            String color,
            String zalo,
            String messenger,
            String hours,
            String manager,
            String image,
            String mapUrl,
            List<String> services,
            String since,
            ListingStatus status,
            String lockReason) {

        public List<String> servicesOrEmpty() {
            return services == null ? new ArrayList<>() : new ArrayList<>(services);
        }

        public ListingStatus statusOrActive() {
            return status == null ? ListingStatus.ACTIVE : status;
        }
    }
}
