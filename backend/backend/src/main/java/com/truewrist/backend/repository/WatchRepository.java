package com.truewrist.backend.repository;

import com.truewrist.backend.domain.Watch;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchRepository extends JpaRepository<Watch, String> {
    List<Watch> findByShopId(String shopId);

    void deleteByShopId(String shopId);
}
