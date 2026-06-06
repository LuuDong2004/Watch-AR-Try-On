package com.truewrist.backend.service;

import com.truewrist.backend.domain.Lead;
import com.truewrist.backend.domain.LeadStatus;
import com.truewrist.backend.domain.Shop;
import com.truewrist.backend.domain.Watch;
import com.truewrist.backend.dto.LeadDtos.LeadCreateRequest;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.LeadRepository;
import com.truewrist.backend.repository.ShopRepository;
import com.truewrist.backend.repository.WatchRepository;
import com.truewrist.backend.security.AppUserPrincipal;
import com.truewrist.backend.util.Ids;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeadService {

    private final LeadRepository leadRepository;
    private final ShopRepository shopRepository;
    private final WatchRepository watchRepository;

    public LeadService(
            LeadRepository leadRepository,
            ShopRepository shopRepository,
            WatchRepository watchRepository) {
        this.leadRepository = leadRepository;
        this.shopRepository = shopRepository;
        this.watchRepository = watchRepository;
    }

    /** Leads visible to the actor: admins see all, shops see only their own. */
    public List<Lead> findForActor(AppUserPrincipal actor) {
        List<Lead> leads;
        if (isAdmin(actor)) {
            leads = leadRepository.findAll();
        } else if (actor.getShopId() != null) {
            leads = leadRepository.findByShopIdIn(List.of(actor.getShopId()));
        } else {
            leads = List.of();
        }
        return leads.stream()
                .sorted(Comparator.comparingLong(Lead::getCreatedAt).reversed())
                .toList();
    }

    /** A customer's own submitted leads (their enquiry history). */
    public List<Lead> findByUser(String userId) {
        return leadRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparingLong(Lead::getCreatedAt).reversed())
                .toList();
    }

    /** Public submission from the storefront contact form. {@code userId} may be null. */
    @Transactional
    public Lead create(LeadCreateRequest req, String userId) {
        Shop shop = shopRepository.findById(req.shopId())
                .orElseThrow(() -> ApiException.badRequest("Cửa hàng không tồn tại."));

        String watchName = req.watchName();
        String watchBrand = req.watchBrand();
        if (req.watchId() != null && !req.watchId().isBlank()) {
            Watch watch = watchRepository.findById(req.watchId()).orElse(null);
            if (watch != null) {
                if (watchName == null || watchName.isBlank()) {
                    watchName = watch.getName();
                }
                if (watchBrand == null || watchBrand.isBlank()) {
                    watchBrand = watch.getBrand();
                }
            }
        }

        long now = System.currentTimeMillis();
        Lead lead = Lead.builder()
                .id(Ids.generate("lead"))
                .name(req.name())
                .phone(req.phone())
                .email(req.email())
                .watchId(req.watchId())
                .watchName(watchName)
                .watchBrand(watchBrand)
                .shopId(shop.getId())
                .shopName(req.shopName() != null ? req.shopName() : shop.getName())
                .type(req.type())
                .date(req.date())
                .time(req.time())
                .message(req.message())
                .status(LeadStatus.NEW)
                .timestamp(Instant.now().toString())
                .channel(req.channelOrForm())
                .hasTriedOn(req.hasTriedOnOrFalse())
                .triedOnImage(req.triedOnImage())
                .userId(userId)
                .createdAt(now)
                .build();
        return leadRepository.save(lead);
    }

    @Transactional
    public Lead updateStatus(String id, LeadStatus status, AppUserPrincipal actor) {
        Lead lead = findOwned(id, actor);
        lead.setStatus(status);
        return leadRepository.save(lead);
    }

    @Transactional
    public void delete(String id, AppUserPrincipal actor) {
        Lead lead = findOwned(id, actor);
        leadRepository.delete(lead);
    }

    private Lead findOwned(String id, AppUserPrincipal actor) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy lead."));
        if (!isAdmin(actor) && !lead.getShopId().equals(actor.getShopId())) {
            throw ApiException.forbidden("Bạn chỉ có thể quản lý lead của cửa hàng mình.");
        }
        return lead;
    }

    private boolean isAdmin(AppUserPrincipal actor) {
        return AuthorityUtils.authorityListToSet(actor.getAuthorities()).contains("ROLE_ADMIN");
    }
}
