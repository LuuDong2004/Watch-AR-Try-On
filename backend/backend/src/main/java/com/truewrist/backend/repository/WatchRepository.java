package com.truewrist.backend.repository;

import com.truewrist.backend.domain.Watch;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WatchRepository extends JpaRepository<Watch, String> {
    List<Watch> findByShopId(String shopId);

    void deleteByShopId(String shopId);

    /** Atomically bump the AR try-on counter (avoids a read-modify-write race).
     *  Clears the context afterwards so a follow-up read sees the new value. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Watch w set w.arTryCount = w.arTryCount + 1 where w.id = :id")
    int incrementArTryCount(@Param("id") String id);
}
