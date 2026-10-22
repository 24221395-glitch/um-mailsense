# 03 · Database Design (ERD + data dictionary)

> **SHARED CONTRACT** · Owners: Nazifa + Raihan · **Freeze: 28 Oct** (task W1-SA-04).
> After the freeze, change only on a `contract/` branch approved by both owners.
> Raihan implements these tables in `backend/app/models/` (W2-BE-01).

ERD image: `docs/img/erd.png`

Conventions: table names snake_case plural · primary keys `id` (UUID) · timestamps `timestamptz` in UTC.

## users
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| ms_oid | text UNIQUE NOT NULL | Microsoft account object ID |
| email | text UNIQUE NOT NULL | Siswamail address |
| display_name | text | |
| role | text NOT NULL default `student` | `student` · `org_admin` · `admin` |
| last_synced_at | timestamptz | Last successful Graph sync |
| created_at | timestamptz NOT NULL | |

## user_tokens
| Column | Type | Notes |
|---|---|---|
| user_id | uuid PK, FK → users.id ON DELETE CASCADE | |
| refresh_token_encrypted | text NOT NULL | Encrypted with `SECRET_KEY`; never logged |
| expires_at | timestamptz | |

## emails
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users.id ON DELETE CASCADE | |
| graph_message_id | text NOT NULL | UNIQUE (user_id, graph_message_id) |
| subject | text | |
| sender_name | text | |
| sender_address | text | |
| received_at | timestamptz NOT NULL | |
| body_preview | text | First 255 characters from Graph |
| segment | text NOT NULL | One of the 7 segment codes (see below) |
| segment_source | text NOT NULL default `ai` | `ai` or `user` (student corrected it) |
| confidence | real | 0–1 from the classifier |
| is_read | boolean NOT NULL default false | |
| created_at | timestamptz NOT NULL | |

## email_details
| Column | Type | Notes |
|---|---|---|
| email_id | uuid PK, FK → emails.id ON DELETE CASCADE | |
| deadline | timestamptz | |
| venue | text | |
| organiser | text | |
| link | text | |

## organisations
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text NOT NULL | |
| contact_email | text NOT NULL | |
| description | text | |
| status | text NOT NULL default `pending` | `pending` · `approved` · `rejected` |
| owner_user_id | uuid FK → users.id | |
| created_at | timestamptz NOT NULL | |

## ads
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organisation_id | uuid FK → organisations.id ON DELETE CASCADE | |
| title | text NOT NULL | |
| description | text NOT NULL | |
| category | text NOT NULL | One of the 7 segment codes |
| event_date | timestamptz | |
| deadline | timestamptz | |
| link | text | |
| tags | text[] NOT NULL default `{}` | e.g. `{ai, robotics}` |
| status | text NOT NULL default `pending` | `pending` · `approved` · `removed` |
| created_at | timestamptz NOT NULL | |

## saved_ads
| Column | Type | Notes |
|---|---|---|
| user_id | uuid FK → users.id | PK (user_id, ad_id) |
| ad_id | uuid FK → ads.id | |
| saved_at | timestamptz NOT NULL | |

## cv_profiles
| Column | Type | Notes |
|---|---|---|
| user_id | uuid PK, FK → users.id ON DELETE CASCADE | |
| field_of_study | text | |
| year_of_study | integer | |
| skills | text[] NOT NULL default `{}` | |
| interests | text[] NOT NULL default `{}` | |
| cv_file_path | text | Stored outside the repo (`backend/uploads/`) |
| updated_at | timestamptz NOT NULL | |

## recommendations
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users.id ON DELETE CASCADE | |
| item_type | text NOT NULL | `email` · `ad` |
| item_id | uuid NOT NULL | emails.id or ads.id |
| score | real NOT NULL | 0–1 |
| label | text NOT NULL | `FOR_YOU` · `NOT_FOR_YOU` |
| reason | text | One short sentence shown to the student |
| created_at | timestamptz NOT NULL | UNIQUE (user_id, item_type, item_id) |

## Segment codes (defined once in `ai/mailsense_ai/contracts.py`)
| Code | Shown as |
|---|---|
| `UM_NOTICE` | UM Official Notice |
| `HACKATHON` | Hackathon & Competition |
| `RESEARCH` | Research Opportunity |
| `EVENT` | Events & Programmes |
| `SCHOLARSHIP_CAREER` | Scholarships & Careers |
| `CLUB` | Club & Community |
| `NOT_FOR_ME` | Not for me |
