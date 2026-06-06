package com.truewrist.backend.repository;

import com.truewrist.backend.domain.ClosetItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClosetItemRepository extends JpaRepository<ClosetItem, String> {
    List<ClosetItem> findByUserId(String userId);
}
