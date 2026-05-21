package com.group.mock.entity.enums;

/**
 * Booking lifecycle states. Valid transitions are enforced in the service layer (later steps).
 */
public enum BookingStatus {
    PENDING,
    ACCEPTED,
    PROCESSING,
    WAITING_CUSTOMER_CONFIRMATION,
    FINISHED,
    DECLINED,
    CANCELLED
}
