package com.group.mock.configuration;

import com.group.mock.service.BookingExpiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BookingExpiryScheduler {

    private final BookingExpiryService bookingExpiryService;

    /** Every minute: decline PENDING bookings past bookingDate. */
    @Scheduled(fixedRate = 60_000, initialDelay = 15_000)
    public void expireOverduePendingBookings() {
        bookingExpiryService.expireOverduePendingBookings();
    }
}
