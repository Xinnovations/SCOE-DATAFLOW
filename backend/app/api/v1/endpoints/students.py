from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session

from app.crud import crud_student
from app.schemas import student as student_schema
from app.services.generators import generate_roll_number, generate_institutional_email
from app.core.config import settings
import csv
import io
import smtplib
from email.mime.text import MIMEText
from sqlalchemy.exc import IntegrityError
from app.db.session import get_db

router = APIRouter()

@router.post("/", response_model=student_schema.Student, status_code=status.HTTP_201_CREATED)
def create_student(
    *,
    db: Session = Depends(get_db),
    student_in: student_schema.StudentCreate,
):
    """
    Create new student.
    """
    # Check if email already exists
    student = crud_student.get_student_by_email(db, email=student_in.email)
    if student:
        raise HTTPException(
            status_code=400,
            detail="A student with this email already exists."
        )
    
    # Check if admission number already exists
    student = crud_student.get_student_by_admission_number(
        db, admission_number=student_in.admission_number
    )
    if student:
        raise HTTPException(
            status_code=400,
            detail="A student with this admission number already exists."
        )
    
    return crud_student.create_student(db=db, student=student_in)

@router.post("/import/preview")
async def import_preview(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    content = await file.read()
    text = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    # Validate minimal columns present
    required = [
        'Name','Address','Gender','Category','Date of Birth','Phone Number','Branch','Year','Mother Name'
    ]
    preview = []
    for row in rows:
        errors = []
        for r in required:
            if not row.get(r):
                errors.append(f"Missing {r}")
        preview.append({
            'row': row,
            'is_valid': len(errors) == 0,
            'errors': errors,
        })
    return { 'total': len(rows), 'preview': preview }

@router.post("/import/save")
async def import_save(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    content = await file.read()
    text = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(text))
    total = 0
    successful = 0
    failed = 0
    errors: List[str] = []
    for index, row in enumerate(reader, start=2):
        total += 1
        try:
            name = (row.get('Name') or '').strip()
            if ' ' in name:
                first_name, last_name = name.split(' ', 1)
            else:
                first_name, last_name = name, ''
            roll_number = generate_roll_number()
            dept = row.get('Branch') or 'dept'
            email_institute = generate_institutional_email(name, dept)
            # ensure unique institutional email
            if email_institute and '@' in email_institute:
                local_part, domain_part = email_institute.split('@', 1)
                unique_email = email_institute
                suffix = 1
                while crud_student.get_student_by_email(db, unique_email):
                    unique_email = f"{local_part}{suffix}@{domain_part}"
                    suffix += 1
                email_institute = unique_email

            # ensure unique admission/roll by regenerating if needed
            while crud_student.get_student_by_admission_number(db, roll_number):
                roll_number = generate_roll_number()
            # Use institutional email as the required email to avoid invalid cases like
            # "first.@example.com" when last_name is missing
            payload = student_schema.StudentCreate(
                first_name=first_name,
                last_name=last_name,
                email=email_institute,
                phone=row.get('Phone Number') or None,
                date_of_birth=row.get('Date of Birth'),
                gender=student_schema.Gender[row.get('Gender').lower()],
                address=row.get('Address') or None,
                city=row.get('Branch') or None,
                state=row.get('Year') or None,
                country='India',
                postal_code=None,
                admission_number=roll_number,
                roll_number=roll_number,
                institutional_email=email_institute,
                department=dept,
            )
            # dedupe by email or admission_number before insert
            if crud_student.get_student_by_email(db, payload.email) or \
               crud_student.get_student_by_admission_number(db, payload.admission_number):
                failed += 1
                errors.append(f"Row {index}: Duplicate record (email or roll/admission already exists)")
            else:
                crud_student.create_student(db, payload)
                successful += 1
        except IntegrityError as e:
            db.rollback()
            failed += 1
            errors.append(f"Row {index}: {str(e)}")
        except Exception as e:
            failed += 1
            errors.append(f"Row {index}: {str(e)}")
    return { 'total': total, 'successful': successful, 'failed': failed, 'errors': errors }

@router.get("/export/csv")
def export_students_csv(db: Session = Depends(get_db)):
    students = crud_student.get_students(db)
    headers = [
        'Roll Number','First Name','Last Name','Institutional Email','Personal Email','Phone','Address','Gender','Department'
    ]
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for s in students:
        writer.writerow([
            getattr(s, 'roll_number', ''), s.first_name, s.last_name, getattr(s, 'institutional_email', ''), s.email,
            s.phone or '', s.address or '', s.gender.value, getattr(s, 'department', '')
        ])
    return output.getvalue()

@router.post("/email/csv")
def email_students_csv(
    *,
    db: Session = Depends(get_db),
    background: BackgroundTasks,
    recipient: str,
):
    def _send(csv_content: str):
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD or not settings.SMTP_FROM_EMAIL:
            return
        msg = MIMEText(csv_content)
        msg['Subject'] = 'Students Export'
        msg['From'] = settings.SMTP_FROM_EMAIL
        msg['To'] = recipient
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [recipient], msg.as_string())

    csv_content = export_students_csv(db)
    background.add_task(_send, csv_content)
    return { 'status': 'scheduled' }

@router.get("/", response_model=List[student_schema.Student])
def read_students(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search by name, email, or admission number"),
):
    """
    Retrieve students with optional search and pagination.
    """
    students = crud_student.get_students(
        db, skip=skip, limit=limit, search=search
    )
    return students

@router.get("/count", response_model=int)
def get_students_count(
    db: Session = Depends(get_db),
):
    """
    Get total count of students.
    """
    return crud_student.get_students_count(db)

@router.get("/{student_id}", response_model=student_schema.Student)
def read_student(
    student_id: int,
    db: Session = Depends(get_db),
):
    """
    Get student by ID.
    """
    student = crud_student.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )
    return student

@router.put("/{student_id}", response_model=student_schema.Student)
def update_student(
    *,
    db: Session = Depends(get_db),
    student_id: int,
    student_in: student_schema.StudentUpdate,
):
    """
    Update a student.
    """
    student = crud.crud_student.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )
    
    # Check if email is being updated to an existing email
    if student_in.email and student_in.email != student.email:
        existing_student = crud_student.get_student_by_email(
            db, email=student_in.email
        )
        if existing_student:
            raise HTTPException(
                status_code=400,
                detail="A student with this email already exists."
            )
    
    # Check if admission number is being updated to an existing one
    if student_in.admission_number and student_in.admission_number != student.admission_number:
        existing_student = crud_student.get_student_by_admission_number(
            db, admission_number=student_in.admission_number
        )
        if existing_student:
            raise HTTPException(
                status_code=400,
                detail="A student with this admission number already exists."
            )
    
    return crud_student.update_student(
        db, db_student=student, student_in=student_in
    )

@router.delete("/{student_id}")
def delete_student(
    *,
    db: Session = Depends(get_db),
    student_id: int,
):
    """
    Delete a student.
    """
    student = crud_student.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )
    return crud_student.delete_student(db=db, student_id=student_id)
