package com.truewrist.backend.repository;

import com.truewrist.backend.domain.ProductComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductCommentRepository extends JpaRepository<ProductComment, String> {

    List<ProductComment> findByWatchIdOrderByCreatedAtAsc(String watchId);

    long countByWatchId(String watchId);

    void deleteByParentId(String parentId);
}
