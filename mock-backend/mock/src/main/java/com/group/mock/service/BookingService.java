package com.group.mock.service;

import com.group.mock.entity.Booking;
import com.group.mock.entity.DTO.request.CreateBookingRequest;
import com.group.mock.entity.DTO.request.UpdateBookingPaymentRequest;
import com.group.mock.entity.enums.BookingStatus;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface BookingService {

    Booking createBooking(String username, CreateBookingRequest request);

    Booking acceptBooking(String username, UUID bookingId);

    Booking declineBooking(String username, UUID bookingId);

    Booking startProcessing(String username, UUID bookingId);

    Booking markCompleted(String username, UUID bookingId);

    Booking confirmCompletion(String username, UUID bookingId);

    Booking updatePayment(String username, UUID bookingId, UpdateBookingPaymentRequest request);

    /** Returns bookings for the current customer or technician, optionally filtered by status. */
    List<Booking> getBookings(String username, Collection<BookingStatus> statusFilter);

    Booking getBookingById(String username, UUID bookingId);
}
