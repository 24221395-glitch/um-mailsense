# 04 · API Contract v1

> **SHARED CONTRACT** · Owners: Raihan + Wendi + Iqbal · **Freeze: 28 Oct** (task W1-BE-03).
> After the freeze, change only on a `contract/` branch approved by all three owners.
> The backend's routes and schemas must match this file. The live version is the OpenAPI page at
> `http://localhost:8000/docs`; `backend/openapi.json` is generated from it with `make openapi`.

**Base URL:** `/api/v1` · **Format:** JSON · **Dates:** ISO 8601 UTC (`2026-11-03T09:00:00Z`)
**Auth:** after sign-in the backend sets an HttpOnly session cookie `ms_session`. The frontend sends
requests with `credentials: "include"`. Unauthenticated calls return `401`.
**Errors:** `{"detail": "Human-readable message"}` with the right status code (400, 401, 403, 404, 422, 500).
**Lists:** paginated as `{"items": [...], "total": 120, "page": 1, "page_size": 20}`.

## Shared types
```text
Segment = "UM_NOTICE" | "HACKATHON" | "RESEARCH" | "EVENT" | "SCHOLARSHIP_CAREER" | "CLUB" | "NOT_FOR_ME"
RecLabel = "FOR_YOU" | "NOT_FOR_YOU"

User        { id, email, display_name, role: "student"|"org_admin"|"admin" }
EmailDetails{ deadline: datetime|null, venue: str|null, organiser: str|null, link: str|null }
Email       { id, subject, sender_name, sender_address, received_at, body_preview,
              segment: Segment, segment_source: "ai"|"user", confidence: float|null,
              is_read: bool, details: EmailDetails|null, recommendation: RecLabel|null }
SegmentCount{ segment: Segment, label: str, total: int, unread: int }
Organisation{ id, name, contact_email, description, status: "pending"|"approved"|"rejected" }
Ad          { id, organisation_id, organisation_name, title, description, category: Segment,
              event_date: datetime|null, deadline: datetime|null, link: str|null, tags: str[],
              status: "pending"|"approved"|"removed", saved: bool, recommendation: RecLabel|null }
Profile     { field_of_study: str|null, year_of_study: int|null, skills: str[], interests: str[],
              has_cv: bool, updated_at: datetime|null }
Recommendation { item_type: "email"|"ad", item_id, score: float, label: RecLabel, reason: str|null }
Deadline    { item_type: "email"|"ad", item_id, title, deadline: datetime }
Stats       { users: int, emails_classified: int, organisations: int, ads: int }
```

## Endpoints

### Health
| Method | Path | Response |
|---|---|---|
| GET | `/health` | `{"status": "ok"}` |

### Auth (Raihan)
| Method | Path | Body / query | Response |
|---|---|---|---|
| GET | `/auth/login` | | `302` to Microsoft sign-in |
| GET | `/auth/callback` | `?code=&state=` | Sets `ms_session` cookie, `302` to `FRONTEND_URL/inbox` |
| POST | `/auth/logout` | | `204`, cookie cleared |
| GET | `/me` | | `User` |
| DELETE | `/me` | | `204`; disconnects Siswamail and deletes all the student's data (NFR-01) |

### Emails (Raihan; AI fields from Iqbal)
| Method | Path | Body / query | Response |
|---|---|---|---|
| GET | `/segments` | | `SegmentCount[]` |
| GET | `/emails` | `?segment=&unread_only=&page=1&page_size=20` | Page of `Email` |
| GET | `/emails/{id}` | | `Email` |
| PATCH | `/emails/{id}` | `{"segment"?: Segment, "is_read"?: bool}` | `Email` (segment change sets `segment_source = "user"`) |
| POST | `/emails/sync` | | `202 {"queued": true}` |

### Ads and organisations (Raihan)
| Method | Path | Body / query | Response |
|---|---|---|---|
| GET | `/ads` | `?category=&q=&page=&page_size=` | Page of approved `Ad` |
| GET | `/ads/{id}` | | `Ad` |
| POST | `/ads` | `{title, description, category, event_date?, deadline?, link?, tags[]}` (org_admin) | `201 Ad` (status `pending`) |
| POST | `/ads/{id}/save` | | `204` |
| DELETE | `/ads/{id}/save` | | `204` |
| GET | `/me/saved-ads` | | `Ad[]` |
| POST | `/organisations` | `{name, contact_email, description}` | `201 Organisation` (status `pending`) |
| GET | `/organisations/me` | | `Organisation` or `404` |

### Profile and recommendations (Raihan routes, Iqbal AI)
| Method | Path | Body / query | Response |
|---|---|---|---|
| GET | `/me/profile` | | `Profile` |
| PATCH | `/me/profile` | `{field_of_study?, year_of_study?, skills?, interests?}` | `Profile` |
| POST | `/me/cv` | `multipart/form-data`, field `file` (PDF, max 5 MB) | `Profile` (parsed by AI) |
| GET | `/me/recommendations` | `?item_type=email|ad&label=FOR_YOU` | `Recommendation[]` |
| GET | `/me/deadlines` | `?from=&to=` | `Deadline[]` |

### Admin (Raihan) · role `admin` only, otherwise `403`
| Method | Path | Body / query | Response |
|---|---|---|---|
| GET | `/admin/organisations` | `?status=pending` | `Organisation[]` |
| POST | `/admin/organisations/{id}/approve` | | `Organisation` |
| POST | `/admin/organisations/{id}/reject` | | `Organisation` |
| GET | `/admin/ads` | `?status=pending` | `Ad[]` |
| POST | `/admin/ads/{id}/approve` | | `Ad` |
| DELETE | `/admin/ads/{id}` | | `204` (status set to `removed`) |
| GET | `/admin/stats` | | `Stats` |

## Example: `GET /api/v1/emails?segment=HACKATHON`
```json
{
  "items": [
    {
      "id": "0b9f4b2e-6c1a-4c55-9d36-2b8a0f7e1c11",
      "subject": "[Example] SetuHack 2026 registration closes Friday",
      "sender_name": "Example Society",
      "sender_address": "society@example.um.edu.my",
      "received_at": "2026-11-03T02:15:00Z",
      "body_preview": "Teams of 3–5, 24-hour build, prizes for the top three...",
      "segment": "HACKATHON",
      "segment_source": "ai",
      "confidence": 0.94,
      "is_read": false,
      "details": {"deadline": "2026-11-07T15:59:00Z", "venue": "FSKTM", "organiser": "Example Society", "link": "https://example.com/register"},
      "recommendation": "FOR_YOU"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```
