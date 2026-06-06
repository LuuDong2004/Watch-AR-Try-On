package com.truewrist.backend.service;

import com.truewrist.backend.domain.Feedback;
import com.truewrist.backend.dto.FeedbackDtos.FeedbackCreateRequest;
import com.truewrist.backend.repository.FeedbackRepository;
import com.truewrist.backend.util.Ids;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;

    public FeedbackService(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    public List<Feedback> findAll() {
        List<Feedback> all = feedbackRepository.findAll();
        all.sort(Comparator.comparingLong(Feedback::getCreatedAt).reversed());
        return all;
    }

    /** Public submission; {@code userId} is null for anonymous visitors. */
    @Transactional
    public Feedback create(FeedbackCreateRequest req, String userId) {
        long now = System.currentTimeMillis();
        Feedback fb = Feedback.builder()
                .id(Ids.generate("fb"))
                .target(req.target())
                .shopId(req.shopId())
                .shopName(req.shopName())
                .rating(req.rating())
                .topic(req.topic())
                .message(req.message())
                .name(req.name())
                .contact(req.contact())
                .userId(userId)
                .timestamp(Instant.now().toString())
                .createdAt(now)
                .build();
        return feedbackRepository.save(fb);
    }
}
