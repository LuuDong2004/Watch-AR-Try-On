package com.truewrist.backend.service;

import com.truewrist.backend.domain.ClosetItem;
import com.truewrist.backend.domain.Watch;
import com.truewrist.backend.dto.ClosetDtos.ClosetCreateRequest;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.ClosetItemRepository;
import com.truewrist.backend.repository.WatchRepository;
import com.truewrist.backend.util.Ids;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClosetService {

    private final ClosetItemRepository closetRepository;
    private final WatchRepository watchRepository;

    public ClosetService(ClosetItemRepository closetRepository, WatchRepository watchRepository) {
        this.closetRepository = closetRepository;
        this.watchRepository = watchRepository;
    }

    public List<ClosetItem> findByUser(String userId) {
        return closetRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparingLong(ClosetItem::getCreatedAt).reversed())
                .toList();
    }

    @Transactional
    public ClosetItem create(String userId, ClosetCreateRequest req) {
        Watch watch = watchRepository.findById(req.watchId())
                .orElseThrow(() -> ApiException.badRequest("Không tìm thấy đồng hồ."));
        long now = System.currentTimeMillis();
        ClosetItem item = ClosetItem.builder()
                .id(Ids.generate("closet"))
                .userId(userId)
                .watchId(watch.getId())
                .watchName(watch.getName())
                .watchBrand(watch.getBrand())
                .price(watch.getPrice())
                .imageUrl(req.imageUrl())
                .date(req.date())
                .createdAt(now)
                .build();
        return closetRepository.save(item);
    }

    @Transactional
    public void delete(String userId, String id) {
        ClosetItem item = closetRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy mục."));
        if (!item.getUserId().equals(userId)) {
            throw ApiException.forbidden("Bạn không có quyền xoá mục này.");
        }
        closetRepository.delete(item);
    }
}
