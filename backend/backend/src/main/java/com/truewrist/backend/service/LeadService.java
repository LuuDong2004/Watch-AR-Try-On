package com.truewrist.backend.service;

import com.truewrist.backend.domain.Lead;
import com.truewrist.backend.domain.LeadStatus;
import com.truewrist.backend.domain.LeadType;
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
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.LinkedHashSet;
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

    /** Leads visible to the actor: admins see all, shops see those of every shop they own. */
    public List<Lead> findForActor(AppUserPrincipal actor) {
        List<Lead> leads;
        if (isAdmin(actor)) {
            leads = leadRepository.findAll();
        } else {
            List<String> shopIds = ownedShopIds(actor);
            leads = shopIds.isEmpty() ? List.of() : leadRepository.findByShopIdIn(shopIds);
        }
        return leads.stream()
                .sorted(Comparator.comparingLong(Lead::getCreatedAt).reversed())
                .toList();
    }

    /**
     * Every shop id the actor controls: all shops they own (by {@code ownerId}) plus their
     * currently-active {@code shopId}. A seller can own several shops, while {@code user.shopId}
     * only ever holds one (and may be null) — so filtering leads by that single id alone hid
     * enquiries for the owner's other shops.
     */
    private List<String> ownedShopIds(AppUserPrincipal actor) {
        LinkedHashSet<String> ids = new LinkedHashSet<>();
        for (Shop s : shopRepository.findByOwnerId(actor.getId())) {
            ids.add(s.getId());
        }
        if (actor.getShopId() != null) {
            ids.add(actor.getShopId());
        }
        return List.copyOf(ids);
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

        validateSchedule(req);

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
        if (!isAdmin(actor) && !ownedShopIds(actor).contains(lead.getShopId())) {
            throw ApiException.forbidden("Bạn chỉ có thể quản lý lead của cửa hàng mình.");
        }
        return lead;
    }

    private boolean isAdmin(AppUserPrincipal actor) {
        return AuthorityUtils.authorityListToSet(actor.getAuthorities()).contains("ROLE_ADMIN");
    }

    /** Vietnam local time; appointment dates are judged "past" against this calendar day. */
    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    /**
     * For an appointment, a date and time are required, must parse, and the date must not be in
     * the past. For a plain contact lead the schedule fields are optional, but if supplied they
     * still have to be well-formed (the {@code yyyy-MM-dd} / {@code HH:mm} shapes are enforced by
     * the DTO; here we additionally reject impossible values like {@code 2026-13-40}).
     */
    private void validateSchedule(LeadCreateRequest req) {
        boolean hasDate = req.date() != null && !req.date().isBlank();
        boolean hasTime = req.time() != null && !req.time().isBlank();

        if (req.type() == LeadType.APPOINTMENT && (!hasDate || !hasTime)) {
            throw ApiException.badRequest("Vui lòng chọn ngày và giờ hẹn.");
        }

        LocalDate date = null;
        if (hasDate) {
            try {
                date = LocalDate.parse(req.date());
            } catch (DateTimeParseException e) {
                throw ApiException.badRequest("Ngày hẹn không hợp lệ.");
            }
        }
        if (hasTime) {
            try {
                LocalTime.parse(req.time());
            } catch (DateTimeParseException e) {
                throw ApiException.badRequest("Giờ hẹn không hợp lệ.");
            }
        }

        if (req.type() == LeadType.APPOINTMENT && date.isBefore(LocalDate.now(APP_ZONE))) {
            throw ApiException.badRequest("Ngày hẹn không được ở trong quá khứ.");
        }
    }
}
