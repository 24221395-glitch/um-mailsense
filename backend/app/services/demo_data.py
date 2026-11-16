"""Demo account for trying MailSense without Microsoft/Google keys (DEMO_MODE=true only).

Creates one demo student (with admin rights so every page can be explored), sample
sorted emails, a CV profile, and a verified club with board posts. Safe to call repeatedly.
"""

from datetime import UTC, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Ad, AdSave, CVProfile, Email, OAuthAccount, Organisation, User

DEMO_EMAIL = "demo.student@mailsense.local"
DEMO_CLUB_OWNER = "demo.club@mailsense.local"
MYT = timezone(timedelta(hours=8))

# subject, sender, address, segment, deadline in days, read, recommendation, reason, venue
_EMAILS = [
    (
        "Final examination timetable released",
        "Examination Unit",
        "exam@um.edu.my",
        "UM_NOTICE",
        None,
        False,
        "for_you",
        "Official UM notice",
        None,
    ),
    (
        "Reminder: tuition fee payment deadline",
        "Bursary Office",
        "bursary@um.edu.my",
        "UM_NOTICE",
        4,
        False,
        "for_you",
        "Official UM notice",
        None,
    ),
    (
        "UM Hackathon 2026: build for campus, RM10,000 in prizes",
        "FSKTM Student Society",
        "pesiskom@siswa.um.edu.my",
        "HACKATHON",
        3,
        False,
        "for_you",
        "Matches your skill: Python",
        "FSKTM, Block B",
    ),
    (
        "Vacancy: research assistant for a Malay NLP project",
        "Dept. of Artificial Intelligence",
        "ai-lab@um.edu.my",
        "RESEARCH",
        6,
        False,
        "for_you",
        "Matches your interest: Machine learning",
        None,
    ),
    (
        "Public lecture: The Future of AI in Southeast Asia",
        "Faculty of Computer Science and IT",
        "fsktm@um.edu.my",
        "EVENT",
        None,
        True,
        "for_you",
        "Matches your field: Computer Science",
        "Dewan Kuliah Utama, FSKTM",
    ),
    (
        "Petronas summer internship 2027 applications open",
        "Career Centre UM",
        "career@um.edu.my",
        "SCHOLARSHIP_CAREER",
        18,
        False,
        "not_for_you",
        "Mainly for engineering students",
        None,
    ),
    (
        "Robotics Club open recruitment 2026/2027",
        "UM Robotics Club",
        "robotics.um@gmail.com",
        "CLUB",
        9,
        True,
        "not_for_you",
        "No clear match with your profile",
        None,
    ),
    (
        "Mega 11.11 sale: 50% off laptops",
        "TechMart Malaysia",
        "promo@techmart.example",
        "NOT_FOR_ME",
        None,
        True,
        "not_for_you",
        "Not relevant",
        None,
    ),
]

_ADS = [
    ("Robot Wars 2026", "HACKATHON", 12, "Build a fighting robot with your team. Open to all."),
    ("Intro to ROS workshop", "EVENT", 5, "Hands-on Robot Operating System workshop with Python."),
    ("Committee recruitment", "CLUB", 15, "Join the Robotics Club committee for the new session."),
]


def _user(db: Session, email: str, name: str, role: str = "student") -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(email=email, name=name, role=role)
        db.add(user)
        db.flush()
    return user


def ensure_demo_user(db: Session) -> User:
    """Create the demo data once and return the demo student."""
    user = db.scalar(select(User).where(User.email == DEMO_EMAIL))
    if user is not None:
        return user

    now = datetime.now(MYT)
    user = _user(db, DEMO_EMAIL, "Demo Student", role="admin")
    account = OAuthAccount(
        user_id=user.id,
        provider="demo",
        provider_user_id="demo",
        email=DEMO_EMAIL,
        access_token="demo",
        expires_at=datetime.now(UTC) + timedelta(days=3650),
    )
    db.add(account)
    db.flush()

    for i, (subject, name, address, segment, due, read, rec, reason, venue) in enumerate(_EMAILS):
        deadline = (now + timedelta(days=due)).replace(hour=23, minute=59) if due else None
        db.add(
            Email(
                user_id=user.id,
                account_id=account.id,
                provider_message_id=f"demo-{i}",
                sender_name=name,
                sender_email=address,
                subject=subject,
                snippet=f"Dear students, {subject.lower()}. Please read the details below.",
                body_text=(
                    f"Dear students,\n\n{subject}.\n\nMore information and registration: "
                    f"https://forms.gle/mailsense-demo-{i}\n\nThank you.\n{name}"
                ),
                received_at=now - timedelta(hours=3 + i * 7),
                is_read=read,
                segment=segment,
                segment_confidence=0.9,
                classified_at=now,
                segment_reason="Sample email sorted by the AI",
                deadline=deadline,
                venue=venue,
                organiser=name,
                registration_link=f"https://forms.gle/mailsense-demo-{i}" if due else None,
                recommendation=rec,
                recommendation_score=0.85 if rec == "for_you" else 0.2,
                recommendation_reason=reason,
            )
        )

    db.add(
        CVProfile(
            user_id=user.id,
            field_of_study="Computer Science (Artificial Intelligence)",
            year_of_study=2,
            skills=["Python", "SQL", "TensorFlow", "Public speaking"],
            interests=["Machine learning", "NLP", "Hackathons"],
            summary="Second-year AI student who enjoys NLP projects and hackathons.",
            source="cv",
            cv_filename="demo_cv.pdf",
        )
    )

    owner = _user(db, DEMO_CLUB_OWNER, "Demo Club Owner")
    club = Organisation(
        owner_user_id=owner.id,
        name="UM Robotics Club",
        contact_email="robotics.um@gmail.com",
        description="Building robots and running workshops since 2010.",
        status="approved",
    )
    db.add(club)
    db.flush()
    for title, category, days, text in _ADS:
        ad = Ad(
            organisation_id=club.id,
            title=title,
            description=text,
            category=category,
            event_date=(now + timedelta(days=days)).replace(hour=10, minute=0),
            deadline=(now + timedelta(days=days - 2)).replace(hour=23, minute=59),
            venue="Dewan Tunku Canselor",
            link="https://forms.gle/mailsense-demo-club",
        )
        db.add(ad)
        db.flush()
        if category == "EVENT":
            db.add(AdSave(user_id=user.id, ad_id=ad.id))

    db.commit()
    return user
