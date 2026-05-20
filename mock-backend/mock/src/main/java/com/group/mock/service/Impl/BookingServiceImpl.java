package com.group.mock.service.Impl;

import com.group.mock.entity.Account;
import com.group.mock.entity.Booking;
import com.group.mock.entity.BookingStatusHistory;
import com.group.mock.entity.DTO.request.CreateBookingRequest;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.Voucher;
import com.group.mock.entity.VoucherUsage;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.entity.enums.BookingStatus;
import com.group.mock.entity.enums.VoucherUsageStatus;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.BookingRepository;
import com.group.mock.repository.BookingStatusHistoryRepository;
import com.group.mock.repository.UserProfileRepository;
import com.group.mock.repository.VoucherRepository;
import com.group.mock.repository.VoucherUsageRepository;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.service.BookingService;
import com.group.mock.service.BookingStateTransitionValidator;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final String ROLE_USER = "ROLE_USER";
    private static final String ROLE_WORKER = "ROLE_WORKER";

    private final BookingRepository bookingRepository;
    private final BookingStatusHistoryRepository bookingStatusHistoryRepository;
    private final VoucherRepository voucherRepository;
    private final VoucherUsageRepository voucherUsageRepository;
    private final UserProfileRepository userProfileRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final AccountRepository accountRepository;
    private final BookingStateTransitionValidator transitionValidator;

    @Override
    @Transactional
    public Booking createBooking(String username, CreateBookingRequest request) {
        Account account = loadAccount(username);
        requireRole(account, ROLE_USER, "Only customers can create bookings");

        if (request.getWorkerId() == null || request.getTotalAmount() == null) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_REQUEST",
                    "workerId and totalAmount are required");
        }
        if (request.getTotalAmount().signum() <= 0) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST, "INVALID_AMOUNT", "totalAmount must be positive");
        }

        UserProfile customer = userProfileRepository
                .findById(account.getId())
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND", "Customer profile not found"));

        WorkerProfile worker = workerProfileRepository
                .findById(request.getWorkerId())
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND, "WORKER_NOT_FOUND", "Technician not found"));

        BigDecimal total = request.getTotalAmount().setScale(4, RoundingMode.HALF_UP);
        BigDecimal discount = BigDecimal.ZERO;
        Voucher appliedVoucher = null;

        if (request.getVoucherId() != null) {
            appliedVoucher = voucherRepository
                    .findById(request.getVoucherId())
                    .orElseThrow(() -> new AuthServiceException(
                            HttpStatus.NOT_FOUND, "VOUCHER_NOT_FOUND", "Voucher not found"));
            assertVoucherUsable(appliedVoucher);
            discount = appliedVoucher.getValue().min(total).setScale(4, RoundingMode.HALF_UP);
        }

        BigDecimal finalAmount = total.subtract(discount).max(BigDecimal.ZERO).setScale(4, RoundingMode.HALF_UP);

        Booking booking = new Booking();
        booking.setCustomer(customer);
        booking.setWorker(worker);
        booking.setServiceCode(request.getServiceCode());
        booking.setAddress(request.getAddress());
        booking.setStatus(BookingStatus.PENDING);
        booking.setTotalAmount(total);
        booking.setDiscountAmount(discount);
        booking.setFinalAmount(finalAmount);

        booking = bookingRepository.save(booking);
        recordHistory(booking, null, BookingStatus.PENDING, "Booking created");

        if (appliedVoucher != null) {
            VoucherUsage usage = new VoucherUsage();
            usage.setBooking(booking);
            usage.setVoucher(appliedVoucher);
            usage.setStatus(VoucherUsageStatus.PENDING);
            usage.setAppliedDiscountAmount(discount);
            voucherUsageRepository.save(usage);
        }

        return bookingRepository.findDetailById(booking.getId()).orElse(booking);
    }

    @Override
    @Transactional
    public Booking acceptBooking(String username, UUID bookingId) {
        Account account = loadAccount(username);
        Booking booking =
                bookingRepository.findById(bookingId).orElseThrow(bookingNotFound());
        assertWorker(account, booking);
        transition(booking, BookingStatus.ACCEPTED, "Accepted by technician");
        return bookingRepository.findDetailById(bookingId).orElse(booking);
    }

    @Override
    @Transactional
    public Booking declineBooking(String username, UUID bookingId) {
        Account account = loadAccount(username);
        Booking booking =
                bookingRepository.findById(bookingId).orElseThrow(bookingNotFound());
        assertWorker(account, booking);
        transition(booking, BookingStatus.DECLINED, "Declined by technician");
        return bookingRepository.findDetailById(bookingId).orElse(booking);
    }

    @Override
    @Transactional
    public Booking startProcessing(String username, UUID bookingId) {
        Account account = loadAccount(username);
        Booking booking =
                bookingRepository.findById(bookingId).orElseThrow(bookingNotFound());
        assertWorker(account, booking);
        transition(booking, BookingStatus.PROCESSING, "Repair started");
        return bookingRepository.findDetailById(bookingId).orElse(booking);
    }

    @Override
    @Transactional
    public Booking markCompleted(String username, UUID bookingId) {
        Account account = loadAccount(username);
        Booking booking =
                bookingRepository.findById(bookingId).orElseThrow(bookingNotFound());
        assertWorker(account, booking);
        transition(booking, BookingStatus.WAITING_CUSTOMER_CONFIRMATION, "Work reported complete; awaiting customer");
        return bookingRepository.findDetailById(bookingId).orElse(booking);
    }

    @Override
    @Transactional
    public Booking confirmCompletion(String username, UUID bookingId) {
        Account account = loadAccount(username);
        Booking booking =
                bookingRepository.findDetailById(bookingId).orElseThrow(bookingNotFound());
        assertCustomer(account, booking);

        VoucherUsage usage = booking.getVoucherUsage();

        transition(booking, BookingStatus.FINISHED, "Customer confirmed completion");

        if (usage != null) {
            usage.setStatus(VoucherUsageStatus.REDEEMED);
            usage.setRedeemedAt(LocalDateTime.now());
            voucherUsageRepository.save(usage);
        }

        System.out.println("reward technician wallet");

        return bookingRepository.findDetailById(bookingId).orElse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Booking> getBookings(String username, Collection<BookingStatus> statusFilter) {
        Account account = loadAccount(username);
        Collection<BookingStatus> filter =
                (statusFilter == null || statusFilter.isEmpty()) ? null : statusFilter;

        if (hasRole(account, ROLE_USER)) {
            UUID customerId = account.getId();
            if (filter == null) {
                return bookingRepository.findByCustomer_IdOrderByCreatedAtDesc(customerId);
            }
            return bookingRepository.findByCustomer_IdAndStatusInOrderByCreatedAtDesc(customerId, filter);
        }
        if (hasRole(account, ROLE_WORKER)) {
            UUID workerId = account.getId();
            if (filter == null) {
                return bookingRepository.findByWorker_IdOrderByCreatedAtDesc(workerId);
            }
            return bookingRepository.findByWorker_IdAndStatusInOrderByCreatedAtDesc(workerId, filter);
        }
        throw new AuthServiceException(
                HttpStatus.FORBIDDEN,
                "BOOKING_ACCESS_DENIED",
                "Only customers or technicians can list bookings");
    }

    @Override
    @Transactional(readOnly = true)
    public Booking getBookingById(String username, UUID bookingId) {
        Account account = loadAccount(username);
        Booking booking =
                bookingRepository.findDetailById(bookingId).orElseThrow(bookingNotFound());

        boolean customer = hasRole(account, ROLE_USER)
                && booking.getCustomer().getId().equals(account.getId());
        boolean worker = hasRole(account, ROLE_WORKER)
                && booking.getWorker().getId().equals(account.getId());

        if (customer || worker) {
            return booking;
        }
        throw new AuthServiceException(HttpStatus.FORBIDDEN, "BOOKING_ACCESS_DENIED", "You cannot access this booking");
    }

    private void transition(Booking booking, BookingStatus next, String note) {
        BookingStatus prev = booking.getStatus();
        transitionValidator.requireTransition(prev, next);
        booking.setStatus(next);
        recordHistory(booking, prev, next, note);
        bookingRepository.save(booking);
    }

    private void recordHistory(Booking booking, BookingStatus from, BookingStatus to, String note) {
        BookingStatusHistory row = new BookingStatusHistory();
        row.setBooking(booking);
        row.setFromStatus(from);
        row.setToStatus(to);
        row.setNote(note);
        bookingStatusHistoryRepository.save(row);
    }

    private Account loadAccount(String username) {
        return accountRepository
                .findByUsername(username)
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.UNAUTHORIZED, "ACCOUNT_NOT_FOUND", "Account not found"));
    }

    private java.util.function.Supplier<AuthServiceException> bookingNotFound() {
        return () -> new AuthServiceException(HttpStatus.NOT_FOUND, "BOOKING_NOT_FOUND", "Booking not found");
    }

    private void assertWorker(Account account, Booking booking) {
        requireRole(account, ROLE_WORKER, "Only technicians can perform this action");
        if (!booking.getWorker().getId().equals(account.getId())) {
            throw new AuthServiceException(
                    HttpStatus.FORBIDDEN,
                    "NOT_BOOKING_WORKER",
                    "This booking is assigned to another technician");
        }
    }

    private void assertCustomer(Account account, Booking booking) {
        requireRole(account, ROLE_USER, "Only the customer can confirm completion");
        if (!booking.getCustomer().getId().equals(account.getId())) {
            throw new AuthServiceException(
                    HttpStatus.FORBIDDEN, "NOT_BOOKING_CUSTOMER", "You are not the customer for this booking");
        }
    }

    private void requireRole(Account account, String role, String message) {
        if (!hasRole(account, role)) {
            throw new AuthServiceException(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
        }
    }

    private boolean hasRole(Account account, String role) {
        for (GrantedAuthority authority : account.getAuthorities()) {
            if (role.equalsIgnoreCase(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    private void assertVoucherUsable(Voucher voucher) {
        if (voucher.getExpiryDate() != null && voucher.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "VOUCHER_EXPIRED", "Voucher has expired");
        }
    }
}
