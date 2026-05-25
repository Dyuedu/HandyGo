package com.group.mock.service;

import com.group.mock.entity.Booking;
import com.group.mock.entity.enums.BookingStatus;
import com.group.mock.repository.BookingRepository;
import com.group.mock.repository.BookingStatusHistoryRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Auto-decline PENDING bookings past their scheduled time without technician acceptance. */
@Service
@RequiredArgsConstructor
public class BookingExpiryService {

    private final BookingRepository bookingRepository;
    private final BookingStatusHistoryRepository bookingStatusHistoryRepository;
    private final BookingStateTransitionValidator transitionValidator;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void expireOverduePendingBookings() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> overdue =
                bookingRepository.findByStatusAndBookingDateBefore(BookingStatus.PENDING, now);
        for (Booking booking : overdue) {
            BookingStatus prev = booking.getStatus();
            transitionValidator.requireTransition(prev, BookingStatus.DECLINED);
            booking.setStatus(BookingStatus.DECLINED);
            bookingRepository.save(booking);
            recordHistory(
                    booking,
                    prev,
                    BookingStatus.DECLINED,
                    "Auto-declined: appointment time passed without technician acceptance");
        }
    }

    private void recordHistory(Booking booking, BookingStatus from, BookingStatus to, String note) {
        var row = new com.group.mock.entity.BookingStatusHistory();
        row.setBooking(booking);
        row.setFromStatus(from);
        row.setToStatus(to);
        row.setNote(note);
        bookingStatusHistoryRepository.save(row);
    }
}
