package com.truewrist.backend.dto;

import com.truewrist.backend.domain.ConversationTarget;
import com.truewrist.backend.domain.Message;
import com.truewrist.backend.domain.MessageSenderRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class MessagingDtos {

    private MessagingDtos() {}

    /** Customer starts a new thread to ADMIN or a specific SHOP. */
    public record StartConversationRequest(
            @NotNull ConversationTarget target,
            String shopId,
            @NotBlank @Size(max = 200) String subject,
            @NotBlank @Size(max = 4000) String body) {}

    /** A seller opens a thread to the platform admins ({@code shopId} optional —
     *  defaults to the seller's first shop). */
    public record StartShopAdminRequest(
            String shopId,
            @NotBlank @Size(max = 200) String subject,
            @NotBlank @Size(max = 4000) String body) {}

    /** Append a message to an existing thread. */
    public record SendMessageRequest(@NotBlank @Size(max = 4000) String body) {}

    public record MessageResponse(
            String id,
            String senderId,
            String senderName,
            MessageSenderRole senderRole,
            String body,
            long createdAt) {

        public static MessageResponse from(Message m) {
            return new MessageResponse(
                    m.getId(),
                    m.getSenderId(),
                    m.getSenderName(),
                    m.getSenderRole(),
                    m.getBody(),
                    m.getCreatedAt());
        }
    }

    /**
     * A thread row, rendered from the viewer's perspective: {@code unread} and
     * {@code counterpartName} are resolved for whoever is asking (customer vs staff).
     */
    public record ConversationResponse(
            String id,
            ConversationTarget targetType,
            String shopId,
            String shopName,
            String customerId,
            String customerName,
            String customerEmail,
            String counterpartName,
            String subject,
            String lastMessage,
            MessageSenderRole lastSenderRole,
            int unread,
            /** Role the initiator plays (CUSTOMER, or SHOP for shop→admin threads). */
            MessageSenderRole initiatorRole,
            /** True when the viewer is the thread initiator (drives icon/labels). */
            boolean viewerIsInitiator,
            long createdAt,
            long updatedAt) {}

    /** A conversation plus its full message history. */
    public record ThreadResponse(ConversationResponse conversation, List<MessageResponse> messages) {}
}
