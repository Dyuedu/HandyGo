package com.group.mock.controller;

import com.group.mock.entity.Booking;
import com.group.mock.entity.DTO.request.CreateBookingRequest;
import com.group.mock.entity.DTO.request.UpdateBookingPaymentRequest;
import com.group.mock.entity.enums.BookingStatus;
import com.group.mock.service.BookingService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<Booking> createBooking(
            Authentication authentication, @Valid @RequestBody CreateBookingRequest request) {
        Booking created = bookingService.createBooking(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<Booking> acceptBooking(Authentication authentication, @PathVariable("id") UUID id) {
        return ResponseEntity.ok(bookingService.acceptBooking(authentication.getName(), id));
    }

    @PatchMapping("/{id}/decline")
    public ResponseEntity<Booking> declineBooking(Authentication authentication, @PathVariable("id") UUID id) {
        return ResponseEntity.ok(bookingService.declineBooking(authentication.getName(), id));
    }

    @PatchMapping("/{id}/processing")
    public ResponseEntity<Booking> startProcessing(Authentication authentication, @PathVariable("id") UUID id) {
        return ResponseEntity.ok(bookingService.startProcessing(authentication.getName(), id));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<Booking> markCompleted(
            Authentication authentication,
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateBookingPaymentRequest request) {
        return ResponseEntity.ok(bookingService.markCompleted(authentication.getName(), id, request));
    }

    @PatchMapping("/{id}/payment")
    public ResponseEntity<Booking> updatePayment(
            Authentication authentication,
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateBookingPaymentRequest request) {
        return ResponseEntity.ok(bookingService.updatePayment(authentication.getName(), id, request));
    }

    @PatchMapping("/{id}/confirm")
    public ResponseEntity<Booking> confirmCompletion(Authentication authentication, @PathVariable("id") UUID id) {
        return ResponseEntity.ok(bookingService.confirmCompletion(authentication.getName(), id));
    }

    @GetMapping
    public ResponseEntity<List<Booking>> listBookings(
            Authentication authentication,
            @RequestParam(required = false) List<BookingStatus> status) {
        return ResponseEntity.ok(bookingService.getBookings(authentication.getName(), status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(Authentication authentication, @PathVariable("id") UUID id) {
        return ResponseEntity.ok(bookingService.getBookingById(authentication.getName(), id));
    }
}
