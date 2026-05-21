package com.group.mock.service;

import com.group.mock.entity.enums.BookingStatus;
import com.group.mock.exception.AuthServiceException;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Enforces allowed booking status transitions. Invalid transitions are rejected with 409 CONFLICT.
 */
@Component
public class BookingStateTransitionValidator {

    private static final Map<BookingStatus, Set<BookingStatus>> ALLOWED = buildGraph();

    private static Map<BookingStatus, Set<BookingStatus>> buildGraph() {
        Map<BookingStatus, Set<BookingStatus>> m = new EnumMap<>(BookingStatus.class);
        m.put(BookingStatus.PENDING, EnumSet.of(BookingStatus.ACCEPTED, BookingStatus.DECLINED, BookingStatus.CANCELLED));
        m.put(BookingStatus.ACCEPTED, EnumSet.of(BookingStatus.PROCESSING));
        m.put(
                BookingStatus.PROCESSING,
                EnumSet.of(BookingStatus.WAITING_CUSTOMER_CONFIRMATION));
        m.put(BookingStatus.WAITING_CUSTOMER_CONFIRMATION, EnumSet.of(BookingStatus.FINISHED));
        // Terminal states: FINISHED, DECLINED, CANCELLED — no outgoing edges
        return m;
    }

    public void requireTransition(BookingStatus current, BookingStatus next) {
        Set<BookingStatus> allowed = ALLOWED.get(current);
        if (allowed == null || !allowed.contains(next)) {
            throw new AuthServiceException(
                    HttpStatus.CONFLICT,
                    "INVALID_BOOKING_TRANSITION",
                    "Cannot transition booking from " + current + " to " + next);
        }
    }
}
