package com.truewrist.backend.dto;

import com.truewrist.backend.domain.Lead;
import com.truewrist.backend.domain.LeadChannel;
import com.truewrist.backend.domain.LeadStatus;
import com.truewrist.backend.domain.LeadType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** Request/response payloads for leads. */
public final class LeadDtos {

    private LeadDtos() {}

    public record LeadResponse(
            String id,
            String name,
            String phone,
            String email,
            String watchId,
            String watchName,
            String watchBrand,
            String shopId,
            String shopName,
            LeadType type,
            String date,
            String time,
            String message,
            LeadStatus status,
            String timestamp,
            LeadChannel channel,
            boolean hasTriedOn,
            String triedOnImage,
            long createdAt) {

        public static LeadResponse from(Lead l) {
            return new LeadResponse(
                    l.getId(), l.getName(), l.getPhone(), l.getEmail(), l.getWatchId(),
                    l.getWatchName(), l.getWatchBrand(), l.getShopId(), l.getShopName(),
                    l.getType(), l.getDate(), l.getTime(), l.getMessage(), l.getStatus(),
                    l.getTimestamp(), l.getChannel(), l.isHasTriedOn(), l.getTriedOnImage(),
                    l.getCreatedAt());
        }
    }

    public record LeadCreateRequest(
            @NotBlank String name,
            @NotBlank(message = "Vui lòng nhập số điện thoại.")
                    @Pattern(
                            regexp = "^(0|\\+84)\\d{9,10}$",
                            message = "Số điện thoại không hợp lệ. Dùng định dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.")
                    String phone,
            String email,
            String watchId,
            String watchName,
            String watchBrand,
            @NotBlank String shopId,
            String shopName,
            @NotNull LeadType type,
            @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "Ngày hẹn không hợp lệ (yyyy-MM-dd).")
                    String date,
            @Pattern(regexp = "^\\d{2}:\\d{2}$", message = "Giờ hẹn không hợp lệ (HH:mm).")
                    String time,
            String message,
            LeadChannel channel,
            Boolean hasTriedOn,
            String triedOnImage) {

        public LeadChannel channelOrForm() {
            return channel == null ? LeadChannel.FORM : channel;
        }

        public boolean hasTriedOnOrFalse() {
            return hasTriedOn != null && hasTriedOn;
        }
    }

    public record LeadStatusUpdateRequest(@NotNull LeadStatus status) {}
}
