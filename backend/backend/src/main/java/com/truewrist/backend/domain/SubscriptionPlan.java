package com.truewrist.backend.domain;

import java.util.List;

public enum SubscriptionPlan {
    TRIAL(
            "Dùng thử",
            "Trải nghiệm các tính năng quản lý cửa hàng",
            0,
            14,
            1,
            10,
            false,
            List.of(
                    "1 cửa hàng",
                    "Tối đa 10 sản phẩm",
                    "Quản lý liên hệ khách hàng",
                    "Trải nghiệm AR cơ bản")),
    ESSENTIAL(
            "Gói Tháng",
            "Quyền bán hàng 1 tháng cho cửa hàng mới bắt đầu",
            499_000,
            30,
            3,
            50,
            false,
            List.of(
                    "Tối đa 3 cửa hàng",
                    "Tối đa 50 sản phẩm",
                    "Quản lý liên hệ và lịch hẹn",
                    "Thống kê hoạt động cửa hàng",
                    "Hỗ trợ AR Try-on")),
    PREMIUM(
            "Premium",
            "Dành cho chuỗi cửa hàng và đại lý",
            4_199_000,
            365,
            50,
            -1,
            true,
            List.of(
                    "Tối đa 50 cửa hàng",
                    "Sản phẩm không giới hạn",
                    "Toàn bộ tính năng Essential",
                    "Ưu tiên hiển thị sản phẩm",
                    "Hỗ trợ kỹ thuật ưu tiên"));

    private final String displayName;
    private final String description;
    private final long price;
    private final int durationDays;
    private final int maxShops;
    private final int maxProducts;
    private final boolean recommended;
    private final List<String> features;

    SubscriptionPlan(
            String displayName,
            String description,
            long price,
            int durationDays,
            int maxShops,
            int maxProducts,
            boolean recommended,
            List<String> features) {
        this.displayName = displayName;
        this.description = description;
        this.price = price;
        this.durationDays = durationDays;
        this.maxShops = maxShops;
        this.maxProducts = maxProducts;
        this.recommended = recommended;
        this.features = features;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public long getPrice() {
        return price;
    }

    public int getDurationDays() {
        return durationDays;
    }

    public int getMaxShops() {
        return maxShops;
    }

    public int getMaxProducts() {
        return maxProducts;
    }

    public boolean isRecommended() {
        return recommended;
    }

    public List<String> getFeatures() {
        return features;
    }
}
