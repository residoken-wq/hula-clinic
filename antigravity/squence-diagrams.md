Sequence Diagrams (Mermaid) — Lịch khám & Workflow toàn diện
Lưu ý: paste các khối mermaid ... vào mermaid.live hoặc công cụ render Mermaid để xem đồ họa.

1) Booking with Hold & Pre-pay (Copay / Preauthorization)
Mục tiêu: tránh ghost-booking bằng cơ chế HOLD ngắn hạn; nếu thu tiền trước thì confirm BOOKED, nếu không thì release hold.

sequenceDiagram
  participant PatientUI
  participant SchedulerSvc as Scheduler Service
  participant AvailabilitySvc as Availability Service
  participant AppointmentSvc as Appointment Service
  participant PaymentSvc as Payment Service
  participant NotificationSvc as Notification Service
  participant CalendarSvc as Calendar Service

  PatientUI->>SchedulerSvc: GET /availability?provider&from&to
  SchedulerSvc->>AvailabilitySvc: computeSlots(provider,from,to)
  AvailabilitySvc-->>SchedulerSvc: slots[]
  SchedulerSvc-->>PatientUI: slots[]

  PatientUI->>AppointmentSvc: POST /appointments {slot_id, patient, hold:true}
  AppointmentSvc->>AppointmentSvc: create Appointment(status=HELD, hold_until=now+X)
  AppointmentSvc-->>PatientUI: 202 {appointment_id, hold_token, expires_at}

  alt payment required
    PatientUI->>PaymentSvc: POST /payments/preauth {amount, idempotency_key}
    PaymentSvc->>PaymentGateway: preauthorize(...)
    PaymentGateway-->>PaymentSvc: preauth_success
    PaymentSvc-->>AppointmentSvc: preauth_confirm {payment_id}
    AppointmentSvc->>AppointmentSvc: update Appointment(status=BOOKED, hold_token=null)
    AppointmentSvc->>CalendarSvc: createProviderCalendarEvent(appointment)
    AppointmentSvc->>NotificationSvc: sendConfirmationSMS/Email
    AppointmentSvc-->>PatientUI: 201 {status: BOOKED}
  else hold expired / payment fails
    PaymentSvc-->>AppointmentSvc: preauth_failed
    AppointmentSvc->>AppointmentSvc: cancelAppointment(status=CANCELLED, reason=payment_failed)
    AppointmentSvc->>NotificationSvc: sendFailureNotice
    AppointmentSvc-->>PatientUI: 409 {error: payment_failed}
  end
Ghi chú:

Transaction boundary: Appointment create HOLD (local DB transaction). Payment preauth là external; sử dụng saga pattern. Nếu preauth thành công → commit BOOKED; nếu thất bại → compensation = cancel appointment.
Idempotency: client gửi idempotency_key cho PaymentSvc và Appointment creation API.
2) Check-in → Triage → Consultation Start
Mục tiêu: chuyển trạng thái appointment, ghi nhận triage, lock medical record cho provider.

sequenceDiagram
  participant FrontDesk
  participant AppointmentSvc as Appointment Service
  participant TriageSvc as Triage/Nurse Service
  participant MedicalRecordSvc as MedicalRecord Service
  participant ProviderUI
  participant NotificationSvc as Notification Service

  FrontDesk->>AppointmentSvc: POST /appointments/{id}/checkin {arrived_at, verified_id}
  AppointmentSvc->>AppointmentSvc: update status CHECKED_IN, record arrival
  AppointmentSvc->>NotificationSvc: emit AppointmentCheckedIn(event)
  AppointmentSvc-->>FrontDesk: 200 OK

  AppointmentSvc->>TriageSvc: createTriageEntry(appointment_id, queue_position)
  TriageSvc-->>AppointmentSvc: triage_created{triage_id, vitals_pending}
  TriageSvc->>MedicalRecordSvc: createDraftMedicalRecord(appointment_id, patient_id)
  MedicalRecordSvc-->>TriageSvc: medical_record_id

  ProviderUI->>AppointmentSvc: POST /appointments/{id}/start
  AppointmentSvc->>AppointmentSvc: set status IN_PROGRESS
  AppointmentSvc->>MedicalRecordSvc: lockRecord(medical_record_id, provider_id)
  MedicalRecordSvc-->>ProviderUI: medical_record (locked)
  AppointmentSvc->>NotificationSvc: emit ConsultationStarted
  AppointmentSvc-->>ProviderUI: 200 OK
Ghi chú:

Locking: MedicalRecordSvc cung cấp mechanism for record lock (optimistic/ pessimistic) to prevent concurrent edits.
Triage may update MedicalRecord draft multiple times before provider starts.
3) Prescription Issuance → Pharmacy Reserve/Dispense → Invoice Item Creation
Mục tiêu: đảm bảo stock consistency (FEFO), tạo stock transactions atomically và gắn invoice items.

sequenceDiagram
  participant ProviderUI
  participant MedicalRecordSvc as MedicalRecord Service
  participant PrescriptionSvc as Prescription Service
  participant PharmacySvc as Pharmacy/Inventory Service
  participant InventoryDB as Inventory DB
  participant BillingSvc as Billing Service
  participant NotificationSvc as Notification Service

  ProviderUI->>MedicalRecordSvc: PATCH /medical-records/{id}/add-prescription {items[]}
  MedicalRecordSvc->>PrescriptionSvc: POST /prescriptions {medical_record_id, items}
  PrescriptionSvc->>PrescriptionSvc: create prescription (status=ISSUED)
  PrescriptionSvc-->>ProviderUI: 201 {prescription_id}

  PrescriptionSvc->>PharmacySvc: POST /prescriptions/{id}/reserve {warehouse_id}
  PharmacySvc->>InventoryDB: SELECT batches WHERE medicine_id FOR UPDATE (FEFO)
  InventoryDB-->>PharmacySvc: batches[]
  alt enough stock
    PharmacySvc->>InventoryDB: insert MedicineStockTransaction type=EXPORT per batch (within DB tx)
    InventoryDB-->>PharmacySvc: commit
    PharmacySvc->>BillingSvc: POST /invoices/{appointment_id}/items {medicine_items}
    BillingSvc-->>PharmacySvc: invoice_item_ids
    PharmacySvc->>PrescriptionSvc: updatePrescriptionStatus {status=DISPENSED}
    PharmacySvc->>NotificationSvc: sendPickupReady(patient)
    PharmacySvc-->>PrescriptionSvc: 200 OK
  else insufficient stock
    PharmacySvc->>PrescriptionSvc: updatePrescriptionStatus {status=PARTIAL/WAITLIST}
    PharmacySvc->>NotificationSvc: sendStockShortage(patient)
    PharmacySvc-->>PrescriptionSvc: 409 {partial: suggested_qty}
  end
Ghi chú:

Transaction boundary: SELECT ... FOR UPDATE + insert EXPORT + decrement available quantity should be within single DB transaction per warehouse to prevent oversell.
If microservices, InventorySvc must be single-writer for an item or use distributed lock.
BillingSvc may accept invoice items in a separate transaction; use saga/compensation if billing fails (e.g., create credit note or reverse stock).
4) Billing → Insurance Adjudication → Payment Capture
Mục tiêu: xử lý cả trường hợp insurer trả trực tiếp hoặc bệnh nhân trả trước/after; hỗ trợ async adjudication.

sequenceDiagram
  participant BillingUI
  participant BillingSvc as Billing Service
  participant InsuranceSvc as Insurance Adjudication
  participant PaymentGateway as Payment Gateway
  participant Patient

  BillingUI->>BillingSvc: POST /invoices {appointment_id, items, claims_info}
  BillingSvc->>BillingSvc: create Invoice(status=UNPAID)
  BillingSvc->>InsuranceSvc: POST /claims {invoice_id, claim_payload}
  alt insurer sync response
    InsuranceSvc-->>BillingSvc: adjudication_result {covered_amount, status}
    BillingSvc->>BillingSvc: apply adjudication, patient_pay = total - covered
    BillingSvc-->>BillingUI: invoice_created{patient_pay}
  else insurer async
    InsuranceSvc-->>BillingSvc: 202 accepted {claim_id}
    BillingSvc-->>BillingUI: invoice_created{patient_pay: provisional}
    Note right of BillingSvc: await ClaimResult webhook
    InsuranceSvc->>BillingSvc: webhook /events/claim/{id}/result {covered_amount}
    BillingSvc->>BillingSvc: update invoice (adjustments)
  end

  alt patient pays now
    Patient->>PaymentGateway: POST /payments {invoice_id, amount}
    PaymentGateway-->>BillingSvc: payment_success {payment_id}
    BillingSvc->>BillingSvc: update invoice payment_status=PAID
    BillingSvc->>NotificationSvc: sendReceipt
  else billed to insurer / patient pays later
    BillingSvc->>NotificationSvc: sendInvoiceNotice
  end
Ghi chú:

Idempotency keys for claim submissions and payment attempts.
If insurer reduces coverage after dispensing, system must create adjustments/credit notes and notify patient.
Transaction boundaries: invoice creation local; claim is external async; payments update invoice local.
5) Cancellation → Waitlist Auto-fill → Rebooking
Mục tiêu: khi có cancel, hệ thống tự offer slot cho waitlist entries theo priority; support accept/decline.

sequenceDiagram
  participant Patient
  participant AppointmentSvc as Appointment Service
  participant EventBus as Event Bus
  participant WaitlistSvc as Waitlist Service
  participant NotificationSvc as Notification Service
  participant Patient2 as Waitlist Patient

  Patient->>AppointmentSvc: POST /appointments/{id}/cancel {reason}
  AppointmentSvc->>AppointmentSvc: update status=CANCELLED
  AppointmentSvc->>EventBus: publish AppointmentCancelled{appointment_id, slot}
  AppointmentSvc-->>Patient: 200 OK

  EventBus->>WaitlistSvc: AppointmentCancelled event
  WaitlistSvc->>WaitlistSvc: find top_waitlist_entries(slot)
  alt entry found
    WaitlistSvc->>NotificationSvc: sendOffer(entry.patient_id, slot, expires_in=10min)
    NotificationSvc-->>Patient2: push/sms offer
    Patient2->>WaitlistSvc: POST /waitlist/{offer_id}/accept
    WaitlistSvc->>AppointmentSvc: POST /appointments {slot_id, patient2, from_waitlist:true}
    AppointmentSvc->>AppointmentSvc: create appointment(status=BOOKED)
    AppointmentSvc->>NotificationSvc: sendConfirmation(patient2)
  else none
    WaitlistSvc-->>EventBus: no_action
  end
Ghi chú:

Offer acceptance must be guarded by idempotent creation of appointment; use hold during offer acceptance with short TTL.
If multiple waitlist acceptances race, AppointmentSvc must ensure atomic slot assignment (optimistic lock on slot record or DB constraint).
6) Provider Shift Update → Slots Recompute → Patient Notifications / Rebook Actions
Mục tiêu: khi admin thay đổi shift/exceptions, hệ thống recompute slots, disable conflicting slots, xử lý rebooking.

sequenceDiagram
  participant AdminUI
  participant ProviderShiftSvc as Provider Shift Service
  participant SlotSvc as Slot Computation Service
  participant AppointmentSvc as Appointment Service
  participant EventBus as Event Bus
  participant NotificationSvc as Notification Service

  AdminUI->>ProviderShiftSvc: PATCH /providers/{id}/shifts/{shift_id} {start,end,room,exceptions}
  ProviderShiftSvc->>ProviderShiftSvc: update shift
  ProviderShiftSvc->>EventBus: publish ProviderScheduleUpdated{provider_id, shift_id}
  EventBus->>SlotSvc: ProviderScheduleUpdated
  SlotSvc->>SlotSvc: recomputeSlots(provider_id, range)
  SlotSvc->>AppointmentSvc: GET appointments affected by slot changes
  AppointmentSvc-->>SlotSvc: affected_appointments[]
  alt appointments affected
    SlotSvc->>AppointmentSvc: for each appointment -> attemptReallocateOrCancel(appointment_id)
    AppointmentSvc->>AppointmentSvc: if can_reallocate -> reschedule -> notify patient
    AppointmentSvc->>NotificationSvc: sendRescheduleOrCancelNotice(patient)
  else none
    SlotSvc-->>EventBus: SlotsRecomputed (no action)
  end
Ghi chú:

Recompute is best performed asynchronously and batched.
For affected confirmed appointments, try to find alternative slots before cancelling. If cancellation required, follow cancellation policy (notifications, refunds).
Store Audit trail of schedule changes and reasons.
Ghi chú chung về diagrams và thực thi
Các luồng có interaction với external systems (payments, insurers, calendars) cần idempotency keys và retry logic.
Những thao tác ảnh hưởng stock/slot/room phải đảm bảo atomicity — dùng DB transactions, SELECT FOR UPDATE, hoặc single-writer service.
Các flows dài (booking→payment, claim adjudication) nên dùng saga orchestration hoặc choreography với event bus.
Logs & audit: mọi transition trạng thái phải ghi user_id, timestamp, reason.
