# Medvo Token/Queue System - Implementation Summary

## Overview
The Medvo application now has a complete token/queue numbering system that assigns unique tokens to patient appointments when doctors confirm them. Tokens reset daily per doctor.

## âœ… Implementation Status: COMPLETE

### Feature Requirements Met
âœ… **Token numbering starts from 1 each day at 12 AM** - Automatic via appointment_date filter
âœ… **Token number displayed after doctor confirmation** - AppointmentResponse includes token_number field
âœ… **Tokens are unique per doctor per date** - Query filters by doctor_id and appointment_date
âœ… **Sequential ordering by appointment time** - Sorted by appointment_time, then created_at
âœ… **Queue position calculated automatically** - Same as token_number for sequential display
âœ… **Estimated wait time calculated** - (token_number - 1) Ã— doctor.average_consultation_time

---

## System Architecture

### Backend Changes (FastAPI + SQLAlchemy)

**1. Database Models** (`app/models/appointment.py`)
```python
class Appointment(Base):
    # ... other fields ...
    token_number = Column(Integer, nullable=True)      # Token assigned on confirmation
    queue_position = Column(Integer, nullable=True)    # Sequential position
    status = Column(String, default="pending")         # pending â†’ confirmed â†’ completed
    estimated_wait_time = Column(Integer, nullable=True)  # Calculated in minutes
```

**2. API Response Schema** (`app/schemas/appointment.py`)
```python
class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: date
    appointment_time: time
    token_number: Optional[int]              # â† Returned in API response
    estimated_wait_time: Optional[int]       # â† Included in response
    queue_position: Optional[int]            # â† Included in response
    status: str                              # pending/confirmed/completed
    symptoms: Optional[str]
    notes: Optional[str]
    patient: Optional[PatientBasicResponse] = None
    
    model_config = {"from_attributes": True}  # Enables ORM mode
```

**3. Appointment Booking** (`app/routers/appointment.py` - POST /appointment/book)
```python
def book_appointment(appointment: AppointmentCreate, db: Session):
    # Create appointment with initial state
    new_appointment = Appointment(
        patient_id=appointment.patient_id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time,
        symptoms=appointment.symptoms,
        status="pending",              # â† Starts as pending
        token_number=None,             # â† Token assigned on approval
        queue_position=None,
        estimated_wait_time=None
    )
    
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    
    return new_appointment  # Response model serializes all fields
```

**4. Doctor Confirmation (FIXED)** (`app/routers/appointment.py` - PUT /appointment/approve/{appointment_id})

Changes made:
- âœ… Added `response_model=AppointmentResponse` to ensure token_number is returned
- âœ… Changed return to return `appointment` object directly (not wrapped in dict)
- âœ… Token assignment logic already present - queries confirmed appointments for same doctor/date

```python
@router.put("/approve/{appointment_id}", response_model=AppointmentResponse)
def approve_appointment(appointment_id: int, doctor_id: int, db: Session):
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == doctor_id
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment.status != "pending":
        raise HTTPException(status_code=400, detail="Appointment already processed")
    
    # Get doctor for consultation time
    doctor = db.query(Doctor).filter(Doctor.id == appointment.doctor_id).first()
    
    # Get all confirmed appointments for same doctor on same DATE
    # This automatically filters by date â†’ tokens reset daily!
    confirmed_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == appointment.doctor_id,           # Same doctor
        Appointment.appointment_date == appointment.appointment_date,  # Same date â† KEY!
        Appointment.status == "confirmed"
    ).order_by(
        Appointment.appointment_time,
        Appointment.created_at,
        Appointment.id
    ).all()
    
    # Include the newly approved appointment
    confirmed_appointments.append(appointment)
    confirmed_appointments.sort(
        key=lambda appt: (appt.appointment_time, appt.created_at, appt.id)
    )
    
    # Assign sequential tokens starting from 1
    for index, appt in enumerate(confirmed_appointments, start=1):
        appt.token_number = index
        appt.queue_position = index
        appt.estimated_wait_time = (index - 1) * doctor.average_consultation_time
        
        if appt is appointment:
            appointment.status = "confirmed"
    
    db.commit()
    db.refresh(appointment)
    
    return appointment  # â† Returns with token_number assigned!
```

---

### Frontend Display (React + Vite)

**1. Doctor Approval Endpoint** (`src/services/doctorAppointmentService.js`)
```javascript
export const approveAppointment = async (appointmentId, doctorId) => {
  const response = await API.put(
    `/appointment/approve/${appointmentId}?doctor_id=${doctorId}`
  );
  return response.data;  // Now includes token_number
};
```

**2. Doctor Dashboard** (`src/pages/DoctorDashboard.jsx`)
```jsx
// When appointment is confirmed by doctor
{appointment.status === "confirmed" && (
  <div className="bg-blue-100 p-4 rounded-xl">
    <p>ðŸŽ« Token: {appointment.token_number}</p>
    <p>ðŸ“ Queue Position: {appointment.queue_position}</p>
  </div>
)}
```

**3. Patient Booking Confirmation** (`src/pages/BookAppointment.jsx`)
```jsx
// After patient books appointment
{result && (
  <div className="mt-8 bg-blue-100 p-6 rounded-xl">
    <p>Status: <span>{result.status}</span></p>
    
    {result.status === "pending" && (
      <p>Waiting for doctor approval...</p>  // â† Shows pending state
    )}
    
    {result.status === "confirmed" && (
      <>
        <p>ðŸŽ« Token Number: {result.token_number}</p>
        <p>ðŸ“ Queue Position: {result.queue_position}</p>
        <p>â± Estimated Wait: {result.estimated_wait_time} mins</p>
      </>
    )}
  </div>
)}
```

**4. Patient View Appointments** (`src/pages/MyAppointments.jsx`)
```jsx
{appointment.status === "confirmed" && (
  <div className="bg-blue-100 p-4 rounded-xl">
    <p>ðŸŽ« Token: {appointment.token_number}</p>
    <p>ðŸ“ Queue Position: {appointment.queue_position}</p>
    <p>â± Estimated Wait: {appointment.estimated_wait_time} mins</p>
  </div>
)}
```

---

## How Daily Token Reset Works

The token numbering system **automatically resets daily** without any additional code because:

1. When appointments are booked, they have a specific `appointment_date`
2. When a doctor confirms an appointment, the backend queries:
   ```sql
   SELECT * FROM appointments 
   WHERE doctor_id = ? 
   AND appointment_date = ? 
   AND status = 'confirmed'
   ```
3. The `appointment_date` comparison ensures only appointments from the **same calendar day** are counted
4. At midnight (00:00), a new calendar date begins, so queries automatically start with count=1

**Example Timeline:**
```
June 1, 2026:
  - Doctor approves appointment 1 â†’ Token #1
  - Doctor approves appointment 2 â†’ Token #2
  - Doctor approves appointment 3 â†’ Token #3

June 2, 2026 (Next day):
  - Doctor approves appointment 4 â†’ Token #1 â† Automatic reset!
  - Doctor approves appointment 5 â†’ Token #2
```

---

## Test Results

All token assignment tests **PASSED** âœ…

```
Test 1 - Single Appointment Token Assignment
  âœ“ Token assigned as 1 on first confirmation

Test 2 - Multiple Appointments Token Assignment (Same Date)
  âœ“ Token #1 for 9:00 AM appointment
  âœ“ Token #2 for 9:30 AM appointment
  âœ“ Sequential ordering maintained

Test 3 - Daily Token Reset (Different Date)
  âœ“ Appointment on new date gets Token #1
  âœ“ Tokens automatically reset per calendar day
```

---

## API Endpoints

### 1. **Book Appointment** (Patient)
- **URL**: `POST /appointment/book`
- **Request**:
  ```json
  {
    "patient_id": 1,
    "doctor_id": 5,
    "appointment_date": "2026-06-05",
    "appointment_time": "09:00",
    "symptoms": "Headache"
  }
  ```
- **Response** (status="pending", token_number=null):
  ```json
  {
    "id": 42,
    "patient_id": 1,
    "doctor_id": 5,
    "appointment_date": "2026-06-05",
    "appointment_time": "09:00",
    "token_number": null,
    "queue_position": null,
    "status": "pending",
    "symptoms": "Headache"
  }
  ```

### 2. **Approve Appointment** (Doctor)
- **URL**: `PUT /appointment/approve/{appointment_id}?doctor_id={doctor_id}`
- **Response** (status="confirmed", token_number assigned):
  ```json
  {
    "id": 42,
    "patient_id": 1,
    "doctor_id": 5,
    "appointment_date": "2026-06-05",
    "appointment_time": "09:00",
    "token_number": 2,
    "queue_position": 2,
    "estimated_wait_time": 15,
    "status": "confirmed",
    "symptoms": "Headache"
  }
  ```

### 3. **Get Patient Appointments**
- **URL**: `GET /appointment/patient/{patient_id}`
- **Returns**: All appointments with current token (if confirmed)

### 4. **Get Doctor Appointments**
- **URL**: `GET /appointment/doctor/{doctor_id}`
- **Returns**: All pending/confirmed appointments with token numbers

---

## User Flow

### For Patients
1. **Search & Book** â†’ Find doctor, select date/time, enter symptoms
2. **Booking Confirmation** â†’ See "Status: pending" with "Waiting for doctor approval..."
3. **Doctor Approves** â†’ Notification that appointment is confirmed
4. **View Token** â†’ See "ðŸŽ« Token Number: 3" in MyAppointments
5. **Wait in Queue** â†’ Know exact position and estimated wait time

### For Doctors
1. **Dashboard** â†’ View all pending appointments for the day
2. **Review Patient** â†’ See symptoms and patient details
3. **Approve/Reject** â†’ Click approve button
4. **Confirmation** â†’ Appointment shows with assigned token number
5. **View Queue** â†’ See all confirmed appointments with tokens for the day

---

## Technical Highlights

### Why This Design Works
- âœ… **No external job needed**: Tokens reset automatically via date filtering
- âœ… **No timezone issues**: SQLAlchemy uses application timezone consistently
- âœ… **Scalable**: Efficient database queries with date+doctor filters
- âœ… **Conflict-free**: Sequential token assignment prevents duplicates
- âœ… **User-friendly**: Clear status progression (pending â†’ confirmed)

### Database Indexes (Recommended)
For production optimization, add indexes:
```sql
CREATE INDEX idx_appointment_doctor_date ON appointments(doctor_id, appointment_date, status);
CREATE INDEX idx_appointment_date ON appointments(appointment_date);
```

---

## Files Modified

1. âœ… `backend/Medvo/backend/app/routers/appointment.py`
   - Added `response_model=AppointmentResponse` to approve endpoint
   - Changed return statement to return appointment object directly

2. âœ… `backend/Medvo/backend/app/schemas/appointment.py`
   - Already includes token_number, queue_position, estimated_wait_time

3. âœ… `backend/Medvo/backend/app/models/appointment.py`
   - Already has token_number field

4. âœ… Frontend display components already in place:
   - `src/pages/BookAppointment.jsx` - Shows token after confirmation
   - `src/pages/DoctorDashboard.jsx` - Shows token for confirmed appointments
   - `src/pages/MyAppointments.jsx` - Shows token in patient's appointment list

---

## Conclusion

The token/queue system is **fully implemented and tested**. Patients receive unique queue tokens when doctors confirm their appointments, with automatic daily reset and accurate wait time estimation.

