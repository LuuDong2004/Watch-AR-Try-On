package com.truewrist.backend.repository;

import com.truewrist.backend.domain.Conversation;
import com.truewrist.backend.domain.ConversationTarget;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, String> {

    /** A customer's own threads, most recently active first. */
    List<Conversation> findByCustomerIdOrderByUpdatedAtDesc(String customerId);

    /** All admin-addressed threads (the admin inbox). */
    List<Conversation> findByTargetTypeOrderByUpdatedAtDesc(ConversationTarget targetType);

    /** All threads for the given shops (a seller's inbox across their shops). */
    List<Conversation> findByShopIdInOrderByUpdatedAtDesc(List<String> shopIds);

    /** Reuse an existing customer↔target thread instead of opening duplicates. */
    Optional<Conversation> findFirstByCustomerIdAndTargetTypeAndShopId(
            String customerId, ConversationTarget targetType, String shopId);
}
