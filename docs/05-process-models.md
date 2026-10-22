# 05 · Process Models

**Owner:** Nazifa · **Task:** W2-SA-01 · **Due:** 31 Oct · **Status:** TODO

Draw an activity diagram or DFD for each flow, export to `docs/img/`, and describe it below.

## 1. Mail sync and classification
Student signs in → backend stores token → every 10 min Graph returns new messages → each new email goes
through `ai_bridge` → classifier + extractor → saved to `emails` and `email_details` → shown in the inbox.

## 2. CV upload and recommendations
Student uploads PDF → `POST /me/cv` → `parse_cv` → `cv_profiles` → `recommend` scores emails and ads →
`recommendations` → "For you" labels in the web app.

## 3. Organisation and ad posting
Organisation registers → admin approves → organisation posts ad → admin approves → ad on the board →
recommended to matching students.
