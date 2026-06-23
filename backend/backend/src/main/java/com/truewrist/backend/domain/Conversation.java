package com.truewrist.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A message thread between a customer and a recipient — either the platform admins
 * ({@link ConversationTarget#ADMIN}) or a specific shop ({@link ConversationTarget#SHOP}).
 * Holds the denormalised last-message preview and per-side unread counts so the
 * inbox list and notification bell render without scanning every message.
 */
@Entity
@Table(
        name = "conversations",
        indexes = {
                @Index(name = "idx_conv_customer", columnList = "customer_id"),
                @Index(name = "idx_conv_shop", columnList = "shop_id"),
                @Index(name = "idx_conv_target", columnList = "target_type")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @Column(length = 64)
    private String id;

    /** The initiating user's id (a customer, or a shop owner for SHOP→ADMIN threads). */
    @Column(name = "customer_id", nullable = false, length = 64)
    private String customerId;

    /**
     * The role the initiator plays: CUSTOMER for customer-started threads, or SHOP
     * when a seller opens a thread to the platform admins. Null on legacy rows is
     * treated as CUSTOMER. Drives who is "staff" vs the initiator.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "initiator_role", length = 16)
    @Builder.Default
    private MessageSenderRole initiatorRole = MessageSenderRole.CUSTOMER;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 16)
    private ConversationTarget targetType;

    /**
     * Shop id this thread concerns: the target shop for CUSTOMER→SHOP threads, or
     * the initiating shop for SHOP→ADMIN threads; null for plain CUSTOMER→ADMIN.
     */
    @Column(name = "shop_id", length = 64)
    private String shopId;

    @Column(nullable = false, length = 200)
    private String subject;

    /** Preview of the most recent message (for the inbox list). */
    @Column(name = "last_message", length = 280)
    private String lastMessage;

    /** Who sent the most recent message. */
    @Enumerated(EnumType.STRING)
    @Column(name = "last_sender_role", length = 16)
    private MessageSenderRole lastSenderRole;

    /** Unread messages for the customer (incremented when staff replies). */
    @Column(name = "customer_unread", nullable = false)
    @Builder.Default
    private int customerUnread = 0;

    /** Unread messages for the staff side (incremented when the customer writes). */
    @Column(name = "staff_unread", nullable = false)
    @Builder.Default
    private int staffUnread = 0;

    @Column(name = "created_at", nullable = false)
    private long createdAt;

    /** Last activity time — sort key for the inbox. */
    @Column(name = "updated_at", nullable = false)
    private long updatedAt;
}
