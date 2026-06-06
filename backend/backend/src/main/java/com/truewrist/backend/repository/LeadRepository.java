package com.truewrist.backend.repository;

import com.truewrist.backend.domain.Lead;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeadRepository extends JpaRepository<Lead, String> {
    List<Lead> findByShopIdIn(List<String> shopIds);

    List<Lead> findByUserId(String userId);
}
