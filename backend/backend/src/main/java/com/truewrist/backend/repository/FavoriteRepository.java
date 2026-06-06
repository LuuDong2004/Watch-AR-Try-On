package com.truewrist.backend.repository;

import com.truewrist.backend.domain.Favorite;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<Favorite, String> {
    List<Favorite> findByUserId(String userId);

    Optional<Favorite> findByUserIdAndWatchId(String userId, String watchId);

    void deleteByWatchId(String watchId);
}
