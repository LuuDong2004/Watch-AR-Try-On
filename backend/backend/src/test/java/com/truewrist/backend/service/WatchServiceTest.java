package com.truewrist.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.truewrist.backend.domain.ListingStatus;
import com.truewrist.backend.domain.Role;
import com.truewrist.backend.domain.Shop;
import com.truewrist.backend.domain.User;
import com.truewrist.backend.domain.Watch;
import com.truewrist.backend.dto.WatchDtos.WatchRequest;
import com.truewrist.backend.exception.ApiException;
import com.truewrist.backend.repository.FavoriteRepository;
import com.truewrist.backend.repository.ShopRepository;
import com.truewrist.backend.repository.WatchRepository;
import com.truewrist.backend.security.AppUserPrincipal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class WatchServiceTest {

    @Mock
    private WatchRepository watchRepository;

    @Mock
    private ShopRepository shopRepository;

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private StorageService storageService;

    private WatchService watchService;

    @BeforeEach
    void setUp() {
        watchService = new WatchService(watchRepository, shopRepository, favoriteRepository, storageService);
    }

    @Test
    void sellerCanCreateWatchForAnotherOwnedShop() {
        AppUserPrincipal seller = seller("seller-1", "shop-main");
        Shop secondaryShop = Shop.builder()
                .id("shop-secondary")
                .ownerId("seller-1")
                .name("Secondary shop")
                .build();

        when(shopRepository.findById("shop-secondary")).thenReturn(Optional.of(secondaryShop));
        when(shopRepository.existsById("shop-secondary")).thenReturn(true);
        when(watchRepository.save(any(Watch.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Watch created = watchService.create(requestFor("shop-secondary"), seller);

        assertEquals("shop-secondary", created.getShopId());
        verify(watchRepository).save(any(Watch.class));
    }

    @Test
    void sellerCannotCreateWatchForAnotherOwnersShop() {
        AppUserPrincipal seller = seller("seller-1", "shop-main");
        Shop otherShop = Shop.builder()
                .id("shop-other")
                .ownerId("seller-2")
                .name("Other shop")
                .build();

        when(shopRepository.findById("shop-other")).thenReturn(Optional.of(otherShop));

        ApiException error = assertThrows(
                ApiException.class,
                () -> watchService.create(requestFor("shop-other"), seller));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        verify(watchRepository, never()).save(any(Watch.class));
    }

    @Test
    void createKeepsMainImageFirstAndRemovesDuplicates() {
        AppUserPrincipal seller = seller("seller-1", "shop-main");
        when(shopRepository.existsById("shop-main")).thenReturn(true);
        when(watchRepository.save(any(Watch.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Watch created = watchService.create(
                requestFor("shop-main", "main.jpg", List.of("other.jpg", "main.jpg")),
                seller);

        assertIterableEquals(List.of("main.jpg", "other.jpg"), created.getGallery());
    }

    @Test
    void createRejectsMoreThanTenUniqueImages() {
        AppUserPrincipal seller = seller("seller-1", "shop-main");
        List<String> gallery = java.util.stream.IntStream.rangeClosed(1, 10)
                .mapToObj(index -> "gallery-" + index + ".jpg")
                .toList();

        ApiException error = assertThrows(
                ApiException.class,
                () -> watchService.create(requestFor("shop-main", "main.jpg", gallery), seller));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        verify(watchRepository, never()).save(any(Watch.class));
    }

    @Test
    void deleteRemovesUnreferencedMinioAssets() {
        AppUserPrincipal seller = seller("seller-1", "shop-main");
        String image = "https://cdn.example.com/watch-bucket/watches/2026/06/06/main.jpg";
        String gallery = "https://cdn.example.com/watch-bucket/watches/2026/06/06/gallery.jpg";
        Watch watch = Watch.builder()
                .id("w-1")
                .shopId("shop-main")
                .image(image)
                .gallery(List.of(image, gallery))
                .build();

        when(watchRepository.findById("w-1")).thenReturn(Optional.of(watch));
        when(storageService.isStoredUrl(image)).thenReturn(true);
        when(storageService.isStoredUrl(gallery)).thenReturn(true);
        when(watchRepository.findAll()).thenReturn(List.of(watch));

        watchService.delete("w-1", seller);

        verify(favoriteRepository).deleteByWatchId("w-1");
        verify(watchRepository).delete(watch);
        verify(storageService).deleteByUrl(image);
        verify(storageService).deleteByUrl(gallery);
    }

    @Test
    void deleteKeepsMinioAssetStillUsedByAnotherWatch() {
        AppUserPrincipal seller = seller("seller-1", "shop-main");
        String sharedImage = "https://cdn.example.com/watch-bucket/watches/2026/06/06/shared.jpg";
        Watch deleted = Watch.builder()
                .id("w-1")
                .shopId("shop-main")
                .image(sharedImage)
                .gallery(List.of(sharedImage))
                .build();
        Watch other = Watch.builder()
                .id("w-2")
                .shopId("shop-main")
                .image(sharedImage)
                .gallery(List.of(sharedImage))
                .build();

        when(watchRepository.findById("w-1")).thenReturn(Optional.of(deleted));
        when(storageService.isStoredUrl(sharedImage)).thenReturn(true);
        when(watchRepository.findAll()).thenReturn(List.of(deleted, other));

        watchService.delete("w-1", seller);

        verify(storageService, never()).deleteByUrl(sharedImage);
    }

    private AppUserPrincipal seller(String userId, String activeShopId) {
        return new AppUserPrincipal(User.builder()
                .id(userId)
                .email(userId + "@example.com")
                .role(Role.SHOP)
                .shopId(activeShopId)
                .build());
    }

    private WatchRequest requestFor(String shopId) {
        return requestFor(shopId, "https://example.com/watch.jpg", List.of());
    }

    private WatchRequest requestFor(String shopId, String image, List<String> gallery) {
        return new WatchRequest(
                "Test watch",
                "Test brand",
                10_000_000,
                null,
                "",
                Map.of(),
                image,
                gallery,
                "",
                false,
                "chrono",
                null,
                "#ffffff",
                "#000000",
                "#B8924A",
                0.0,
                0,
                ListingStatus.ACTIVE,
                shopId);
    }
}
