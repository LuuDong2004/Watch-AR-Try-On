package com.truewrist.backend.service;

import com.truewrist.backend.domain.Favorite;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.FavoriteRepository;
import com.truewrist.backend.repository.WatchRepository;
import com.truewrist.backend.util.Ids;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final WatchRepository watchRepository;

    public FavoriteService(FavoriteRepository favoriteRepository, WatchRepository watchRepository) {
        this.favoriteRepository = favoriteRepository;
        this.watchRepository = watchRepository;
    }

    /** The watch ids the user has favourited. */
    public List<String> listWatchIds(String userId) {
        return favoriteRepository.findByUserId(userId).stream().map(Favorite::getWatchId).toList();
    }

    /** Toggle a favourite; returns true if it is now favourited. */
    @Transactional
    public boolean toggle(String userId, String watchId) {
        if (!watchRepository.existsById(watchId)) {
            throw ApiException.notFound("Không tìm thấy đồng hồ.");
        }
        Optional<Favorite> existing = favoriteRepository.findByUserIdAndWatchId(userId, watchId);
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return false;
        }
        favoriteRepository.save(Favorite.builder()
                .id(Ids.generate("fav"))
                .userId(userId)
                .watchId(watchId)
                .createdAt(System.currentTimeMillis())
                .build());
        return true;
    }
}
