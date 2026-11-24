package com.smartlocker.locker;

/**
 * 3 kích cỡ ngăn tủ theo docs/prd.md (v2).
 */
public enum CompartmentSize {
    SMALL("Nhỏ"),
    MEDIUM("Vừa"),
    LARGE("Lớn");

    private final String labelVi;

    CompartmentSize(String labelVi) {
        this.labelVi = labelVi;
    }

    public String getLabelVi() {
        return labelVi;
    }
}
