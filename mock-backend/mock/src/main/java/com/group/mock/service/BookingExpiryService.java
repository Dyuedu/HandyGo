package com.group.mock.service;

import com.group.mock.entity.Booking;
import com.group.mock.entity.BookingStatusHistory;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.enums.BookingStatus;
import com.group.mock.repository.BookingStatusHistoryRepository;
import com.group.mock.repository.BookingRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingExpiryService {

    private final BookingRepository bookingRepository;
    private final BookingStatusHistoryRepository bookingStatusHistoryRepository;
    private final BookingStateTransitionValidator transitionValidator;
    private final NotificationEventPublisher notificationEventPublisher;

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void autoDeclinePendingPastScheduledTime() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> expired = bookingRepository.findPendingExpired(now);
        if (expired.isEmpty()) {
            return;
        }

        for (Booking booking : expired) {
            try {
                BookingStatus prev = booking.getStatus();
                transitionValidator.requireTransition(booking.getStatus(), BookingStatus.DECLINED);
                booking.setStatus(BookingStatus.DECLINED);
                bookingRepository.save(booking);

                BookingStatusHistory row = new BookingStatusHistory();
                row.setBooking(booking);
                row.setFromStatus(prev);
                row.setToStatus(BookingStatus.DECLINED);
                row.setNote("Auto-declined: no technician response before scheduled time");
                bookingStatusHistoryRepository.save(row);

                String serviceName = booking.getServiceCode();
                UserProfile customer = booking.getCustomer();
                String customerName = customer != null ? customer.getFullName() : "Khách hàng";

                // Notify both sides that the booking expired before technician response
                notificationEventPublisher.publishBookingExpired(
                        booking.getCustomer().getId(),
                        booking.getId().getMostSignificantBits(),
                        customerName,
                        serviceName,
                        "Không có thợ phản hồi trước giờ hẹn");
                notificationEventPublisher.publishBookingExpired(
                        booking.getWorker().getId(),
                        booking.getId().getMostSignificantBits(),
                        customerName,
                        serviceName,
                        "Bạn chưa phản hồi trước giờ hẹn");
            } catch (Exception e) {
                log.warn("Failed to auto-decline expired booking {}", booking.getId(), e);
            }
        }

        log.info("Auto-declined {} booking(s) past scheduled time without technician response", expired.size());
    }
}

