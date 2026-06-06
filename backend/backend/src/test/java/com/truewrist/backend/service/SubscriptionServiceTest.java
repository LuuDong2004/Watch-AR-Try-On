package com.truewrist.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.truewrist.backend.domain.AuthProvider;
import com.truewrist.backend.domain.Role;
import com.truewrist.backend.domain.ShopSubscription;
import com.truewrist.backend.domain.SubscriptionPlan;
import com.truewrist.backend.domain.SubscriptionStatus;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.domain.UserStatus;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.ShopSubscriptionRepository;
import com.truewrist.backend.security.AppUserPrincipal;
import java.time.Duration;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock
    private ShopSubscriptionRepository subscriptionRepository;

    private SubscriptionService subscriptionService;
    private AppUserPrincipal seller;

    @BeforeEach
    void setUp() {
        subscriptionService = new SubscriptionService(subscriptionRepository);
        seller = new AppUserPrincipal(User.builder()
                .id("seller-1")
                .name("Seller")
                .email("seller@example.com")
                .role(Role.SHOP)
                .status(UserStatus.ACTIVE)
                .provider(AuthProvider.LOCAL)
                .createdAt(System.currentTimeMillis())
                .build());
    }

    @Test
    void createsTrialForSellerWithoutSubscription() {
        when(subscriptionRepository.findByUserId("seller-1")).thenReturn(Optional.empty());
        stubSave();

        var response = subscriptionService.getFor(seller);

        assertEquals(SubscriptionPlan.TRIAL, response.plan());
        assertEquals(SubscriptionStatus.ACTIVE, response.status());
        assertEquals(14, response.daysRemaining());
    }

    @Test
    void upgradesTrialToPremium() {
        ShopSubscription trial = subscription(SubscriptionPlan.TRIAL, 10);
        when(subscriptionRepository.findByUserId("seller-1")).thenReturn(Optional.of(trial));
        stubSave();

        var response = subscriptionService.upgrade(seller, SubscriptionPlan.PREMIUM);

        assertEquals(SubscriptionPlan.PREMIUM, response.plan());
        assertEquals(365, response.daysRemaining());
    }

    @Test
    void renewingSamePlanExtendsCurrentExpiry() {
        ShopSubscription essential = subscription(SubscriptionPlan.ESSENTIAL, 20);
        long previousExpiry = essential.getExpiresAt();
        when(subscriptionRepository.findByUserId("seller-1")).thenReturn(Optional.of(essential));
        stubSave();

        var response = subscriptionService.upgrade(seller, SubscriptionPlan.ESSENTIAL);

        assertEquals(SubscriptionPlan.ESSENTIAL, response.plan());
        assertEquals(previousExpiry + Duration.ofDays(30).toMillis(), response.expiresAt());
    }

    @Test
    void blocksDowngradeWhilePremiumIsActive() {
        ShopSubscription premium = subscription(SubscriptionPlan.PREMIUM, 100);
        when(subscriptionRepository.findByUserId("seller-1")).thenReturn(Optional.of(premium));

        ApiException error = assertThrows(
                ApiException.class,
                () -> subscriptionService.upgrade(seller, SubscriptionPlan.ESSENTIAL));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }

    private ShopSubscription subscription(SubscriptionPlan plan, int remainingDays) {
        long now = System.currentTimeMillis();
        return ShopSubscription.builder()
                .id("sub-1")
                .userId("seller-1")
                .plan(plan)
                .registeredAt(now - Duration.ofDays(5).toMillis())
                .expiresAt(now + Duration.ofDays(remainingDays).toMillis())
                .updatedAt(now)
                .build();
    }

    private void stubSave() {
        when(subscriptionRepository.save(any(ShopSubscription.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }
}
