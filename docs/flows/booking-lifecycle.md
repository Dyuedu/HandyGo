**Vòng đời Booking (State transitions)**

PENDING → (Worker accept) → ACCEPTED

PENDING → (Worker decline) → DECLINED

PENDING → (Customer cancel) → CANCELLED

ACCEPTED → (Worker startProcessing) → PROCESSING

PROCESSING → (Worker markCompleted) → COMPLETED

COMPLETED → (Customer confirmCompletion) → CONFIRMED

Các chuyển trạng thái phải tuân thủ `BookingStateTransitionValidator` trên backend.