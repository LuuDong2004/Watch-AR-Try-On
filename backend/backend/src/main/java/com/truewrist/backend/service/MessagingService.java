package com.truewrist.backend.service;

import com.truewrist.backend.domain.Conversation;
import com.truewrist.backend.domain.ConversationTarget;
import com.truewrist.backend.domain.Message;
import com.truewrist.backend.domain.MessageSenderRole;
import com.truewrist.backend.domain.NotificationType;
import com.truewrist.backend.domain.Role;
import com.truewrist.backend.domain.Shop;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.dto.MessagingDtos.ConversationResponse;
import com.truewrist.backend.dto.MessagingDtos.MessageResponse;
import com.truewrist.backend.dto.MessagingDtos.ThreadResponse;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.ConversationRepository;
import com.truewrist.backend.repository.MessageRepository;
import com.truewrist.backend.repository.ShopRepository;
import com.truewrist.backend.repository.UserRepository;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.util.Ids;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The customer↔staff messaging inbox. A customer opens a thread to the platform
 * admins or to a specific shop; either side appends messages. Per-side unread
 * counts are kept on the conversation, and a bell notification is pushed to the
 * customer whenever staff reply.
 */
@Service
public class MessagingService {

    private static final int PREVIEW_LEN = 200;

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final NotificationService notificationService;

    public MessagingService(
            ConversationRepository conversationRepository,
            MessageRepository messageRepository,
            UserRepository userRepository,
            ShopRepository shopRepository,
            NotificationService notificationService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
        this.notificationService = notificationService;
    }

    // --- Customer: start a thread --------------------------------------------

    @Transactional
    public ThreadResponse startConversation(
            AppUserPrincipal actor, ConversationTarget target, String shopId, String subject, String body) {
        String resolvedShopId = null;
        if (target == ConversationTarget.SHOP) {
            if (shopId == null || shopId.isBlank()) {
                throw ApiException.badRequest("Vui lòng chọn cửa hàng cần liên hệ.");
            }
            Shop shop = shopRepository.findById(shopId)
                    .orElseThrow(() -> ApiException.notFound("Không tìm thấy cửa hàng."));
            if (actor.getId().equals(shop.getOwnerId())) {
                throw ApiException.badRequest("Bạn không thể tự nhắn tin cho cửa hàng của mình.");
            }
            resolvedShopId = shop.getId();
        }

        long now = System.currentTimeMillis();
        String senderName = userName(actor.getId());
        Conversation conv = Conversation.builder()
                .id(Ids.generate("conv"))
                .customerId(actor.getId())
                .targetType(target)
                .shopId(resolvedShopId)
                .subject(subject.trim())
                .lastMessage(preview(body))
                .lastSenderRole(MessageSenderRole.CUSTOMER)
                .customerUnread(0)
                .staffUnread(1)
                .createdAt(now)
                .updatedAt(now)
                .build();
        conversationRepository.save(conv);

        Message message = saveMessage(conv.getId(), actor.getId(), senderName, MessageSenderRole.CUSTOMER, body, now);
        return new ThreadResponse(
                toResponse(conv, true),
                List.of(MessageResponse.from(message)));
    }

    // --- Append a message ----------------------------------------------------

    @Transactional
    public MessageResponse sendMessage(AppUserPrincipal actor, String conversationId, String body) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy hội thoại."));
        MessageSenderRole role = authorizeAndResolveRole(actor, conv);

        long now = System.currentTimeMillis();
        Message message = saveMessage(
                conv.getId(), actor.getId(), userName(actor.getId()), role, body, now);

        conv.setLastMessage(preview(body));
        conv.setLastSenderRole(role);
        conv.setUpdatedAt(now);
        if (role == MessageSenderRole.CUSTOMER) {
            conv.setStaffUnread(conv.getStaffUnread() + 1);
            conv.setCustomerUnread(0);
        } else {
            conv.setCustomerUnread(conv.getCustomerUnread() + 1);
            conv.setStaffUnread(0);
            // Bell the customer that staff replied.
            notificationService.notify(
                    conv.getCustomerId(),
                    NotificationType.MESSAGE,
                    replyTitle(conv),
                    preview(body),
                    conv.getId());
        }
        conversationRepository.save(conv);
        return MessageResponse.from(message);
    }

    // --- Read a thread (marks the viewer's side read) ------------------------

    @Transactional
    public ThreadResponse getThread(AppUserPrincipal actor, String conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy hội thoại."));
        boolean isCustomer = actor.getId().equals(conv.getCustomerId());
        if (!isCustomer) {
            authorizeStaff(actor, conv); // throws if not a permitted staff participant
        }
        // Reset the viewer's unread counter.
        if (isCustomer) {
            conv.setCustomerUnread(0);
        } else {
            conv.setStaffUnread(0);
        }
        conversationRepository.save(conv);

        List<MessageResponse> messages = messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
                .map(MessageResponse::from)
                .toList();
        return new ThreadResponse(toResponse(conv, isCustomer), messages);
    }

    // --- Inbox lists ---------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ConversationResponse> listForCustomer(AppUserPrincipal actor) {
        return conversationRepository.findByCustomerIdOrderByUpdatedAtDesc(actor.getId()).stream()
                .map(c -> toResponse(c, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> listForShop(AppUserPrincipal actor) {
        List<String> shopIds = shopRepository.findByOwnerId(actor.getId()).stream()
                .map(Shop::getId)
                .toList();
        if (shopIds.isEmpty()) {
            return List.of();
        }
        return conversationRepository.findByShopIdInOrderByUpdatedAtDesc(shopIds).stream()
                .map(c -> toResponse(c, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> listForAdmin(AppUserPrincipal actor) {
        return conversationRepository.findByTargetTypeOrderByUpdatedAtDesc(ConversationTarget.ADMIN).stream()
                .map(c -> toResponse(c, false))
                .toList();
    }

    // --- Helpers -------------------------------------------------------------

    private Message saveMessage(
            String conversationId, String senderId, String senderName,
            MessageSenderRole role, String body, long now) {
        Message message = Message.builder()
                .id(Ids.generate("msg"))
                .conversationId(conversationId)
                .senderId(senderId)
                .senderName(senderName)
                .senderRole(role)
                .body(body.trim())
                .createdAt(now)
                .build();
        return messageRepository.save(message);
    }

    /** Verify the actor may participate and return the role their message carries. */
    private MessageSenderRole authorizeAndResolveRole(AppUserPrincipal actor, Conversation conv) {
        if (actor.getId().equals(conv.getCustomerId())) {
            return MessageSenderRole.CUSTOMER;
        }
        authorizeStaff(actor, conv);
        return isAdmin(actor) ? MessageSenderRole.ADMIN : MessageSenderRole.SHOP;
    }

    /** Throw unless the actor is a staff participant of this thread. */
    private void authorizeStaff(AppUserPrincipal actor, Conversation conv) {
        boolean ok = conv.getTargetType() == ConversationTarget.ADMIN
                ? isAdmin(actor)
                : (isAdmin(actor) || ownsShop(actor, conv.getShopId()));
        if (!ok) {
            throw ApiException.forbidden("Bạn không có quyền truy cập hội thoại này.");
        }
    }

    private boolean isAdmin(AppUserPrincipal actor) {
        return actor.getUser().effectiveRoles().contains(Role.ADMIN);
    }

    private boolean ownsShop(AppUserPrincipal actor, String shopId) {
        if (shopId == null) {
            return false;
        }
        return shopRepository.findById(shopId)
                .map(s -> actor.getId().equals(s.getOwnerId()))
                .orElse(false);
    }

    private String replyTitle(Conversation conv) {
        if (conv.getTargetType() == ConversationTarget.ADMIN) {
            return "Quản trị viên đã trả lời";
        }
        String shopName = conv.getShopId() == null ? null
                : shopRepository.findById(conv.getShopId()).map(Shop::getName).orElse(null);
        return (shopName == null ? "Cửa hàng" : shopName) + " đã trả lời";
    }

    private ConversationResponse toResponse(Conversation c, boolean viewerIsCustomer) {
        User customer = userRepository.findById(c.getCustomerId()).orElse(null);
        String customerName = customer == null ? null : customer.getName();
        String customerEmail = customer == null ? null : customer.getEmail();
        String shopName = c.getShopId() == null ? null
                : shopRepository.findById(c.getShopId()).map(Shop::getName).orElse(null);

        String counterpart;
        if (viewerIsCustomer) {
            counterpart = c.getTargetType() == ConversationTarget.ADMIN
                    ? "TrueWrist · Quản trị"
                    : (shopName == null ? "Cửa hàng" : shopName);
        } else {
            counterpart = customerName != null ? customerName
                    : (customerEmail != null ? customerEmail : "Khách hàng");
        }
        int unread = viewerIsCustomer ? c.getCustomerUnread() : c.getStaffUnread();

        return new ConversationResponse(
                c.getId(),
                c.getTargetType(),
                c.getShopId(),
                shopName,
                c.getCustomerId(),
                customerName,
                customerEmail,
                counterpart,
                c.getSubject(),
                c.getLastMessage(),
                c.getLastSenderRole(),
                unread,
                c.getCreatedAt(),
                c.getUpdatedAt());
    }

    private String userName(String userId) {
        return userRepository.findById(userId).map(User::getName).orElse(null);
    }

    private static String preview(String body) {
        String trimmed = body == null ? "" : body.trim();
        return trimmed.length() <= PREVIEW_LEN ? trimmed : trimmed.substring(0, PREVIEW_LEN) + "…";
    }
}
