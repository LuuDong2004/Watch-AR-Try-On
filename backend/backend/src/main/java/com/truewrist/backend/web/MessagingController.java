package com.truewrist.backend.web;

import com.truewrist.backend.dto.MessagingDtos.ConversationResponse;
import com.truewrist.backend.dto.MessagingDtos.MessageResponse;
import com.truewrist.backend.dto.MessagingDtos.SendMessageRequest;
import com.truewrist.backend.dto.MessagingDtos.StartConversationRequest;
import com.truewrist.backend.dto.MessagingDtos.StartShopAdminRequest;
import com.truewrist.backend.dto.MessagingDtos.ThreadResponse;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.service.MessagingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/conversations")
@PreAuthorize("isAuthenticated()")
public class MessagingController {

    private final MessagingService messagingService;

    public MessagingController(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    /** Customer starts a new thread to the admins or a shop. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ThreadResponse start(
            @Valid @RequestBody StartConversationRequest req,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return messagingService.startConversation(actor, req.target(), req.shopId(), req.subject(), req.body());
    }

    /** A seller opens a thread to the platform admins (partner support). */
    @PostMapping("/shop-to-admin")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SHOP')")
    public ThreadResponse startShopToAdmin(
            @Valid @RequestBody StartShopAdminRequest req,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return messagingService.startShopToAdmin(actor, req.shopId(), req.subject(), req.body());
    }

    /** The signed-in customer's own threads. */
    @GetMapping
    public List<ConversationResponse> mine(@AuthenticationPrincipal AppUserPrincipal actor) {
        return messagingService.listForCustomer(actor);
    }

    /** A thread's full message history (marks the viewer's side read). */
    @GetMapping("/{id}")
    public ThreadResponse thread(
            @PathVariable String id,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return messagingService.getThread(actor, id);
    }

    /** Append a message to a thread (customer or staff). */
    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse reply(
            @PathVariable String id,
            @Valid @RequestBody SendMessageRequest req,
            @AuthenticationPrincipal AppUserPrincipal actor) {
        return messagingService.sendMessage(actor, id, req.body());
    }

    /** Seller inbox: threads addressed to the seller's shops. */
    @GetMapping("/inbox/shop")
    @PreAuthorize("hasRole('SHOP')")
    public List<ConversationResponse> shopInbox(@AuthenticationPrincipal AppUserPrincipal actor) {
        return messagingService.listForShop(actor);
    }

    /** Admin inbox: threads addressed to the platform. */
    @GetMapping("/inbox/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ConversationResponse> adminInbox(@AuthenticationPrincipal AppUserPrincipal actor) {
        return messagingService.listForAdmin(actor);
    }
}
