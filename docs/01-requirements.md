# 01 – Requirements Specification

**Project:** UM MailSense – AI-Powered Siswamail Organiser and Opportunity Recommender
**Phase:** Analysis and requirements (Week 1 · Task SA-02)
**Branch:** `docs/W1-SA-02-requirements-specification`
**Status:** Draft – for team review
**Last updated:** 1 November 2026

---

## 1. Purpose

This document lists what UM MailSense must do (functional requirements) and the quality standards it must meet (non-functional requirements). Each requirement has an ID so it can be traced through design, development and testing.

## 2. Priority key (MoSCoW)

| Priority | Meaning |
|---|---|
| **Must** | Required for the public launch on 19 Feb 2027. The app fails without it. |
| **Should** | Important and planned for launch, but the app still works without it. |
| **Could** | Nice to have. Built only if time allows after Must and Should items. |

## 3. Users

| User | Description |
|---|---|
| **Student** | UM student with a Siswamail account (@siswa.um.edu.my). Connects inbox, uploads CV, browses sorted mail and recommendations. |
| **Organisation / Club** | Verified student organisation or club. Publishes programmes on the advertisement board. |
| **Administrator** | Project/system admin. Approves organisations, moderates posts, manages segments, monitors the system. |

---

## 4. Functional requirements

### 4.1 Sign-in and account (Siswamail SSO)

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | The system shall let students sign in with their Siswamail account through Microsoft Entra ID single sign-on (OAuth 2.0). | Must |
| FR-02 | The system shall never ask for or store the student's Siswamail password; the password is entered only on Microsoft's sign-in page. | Must |
| FR-03 | The system shall ask the student for read-only mailbox consent (Microsoft Graph `Mail.Read`) before accessing any email. | Must |
| FR-04 | The system shall allow only `@siswa.um.edu.my` accounts to register as students. | Must |
| FR-05 | The system shall let a student disconnect their mailbox and delete their account and all stored data at any time. | Must |
| FR-06 | The system shall let a student sign out on any device. | Must |

### 4.2 Mail sync and inbox view

| ID | Requirement | Priority |
|---|---|---|
| FR-07 | The system shall sync the student's Siswamail inbox through the Microsoft Graph API. | Must |
| FR-08 | The system shall fetch new emails automatically (e.g. by Graph change notifications or periodic polling). | Must |
| FR-09 | The system shall display the student's real emails in a live inbox view with sender, subject, date and preview. | Must |
| FR-10 | The system shall let the student open an email and read its full content inside the app. | Must |
| FR-11 | The system shall let the student search emails by keyword, sender or segment. | Should |
| FR-12 | The system shall provide a link to open the original email in Outlook. | Could |

### 4.3 AI segmentation

| ID | Requirement | Priority |
|---|---|---|
| FR-13 | The system shall classify each new email into one segment using an LLM: UM Official Notice, Hackathon & Competition, Research Opportunity, Events & Programmes, Scholarships & Careers, Club & Community, Not for me. | Must |
| FR-14 | The system shall classify each email only once and store the result, so the same email is never sent to the LLM again. | Must |
| FR-15 | The system shall extract key details from each email where present: deadline, venue, organiser and registration link. | Must |
| FR-16 | The system shall show emails grouped by segment, with a count of unread emails per segment. | Must |
| FR-17 | The system shall visually highlight UM Official Notices so they stand out from promotional mail. | Should |
| FR-18 | The system shall let the student move an email to a different segment manually. | Should |
| FR-19 | The system shall use the student's manual corrections to improve future classification for that student (feedback loop). | Could |

### 4.4 CV-based profile and recommendations

| ID | Requirement | Priority |
|---|---|---|
| FR-20 | The system shall let the student upload a CV (PDF or DOCX). | Must |
| FR-21 | The system shall extract field of study, skills and interests from the uploaded CV. | Must |
| FR-22 | The system shall let the student view and edit the extracted profile (field, year, skills, interests). | Must |
| FR-23 | The system shall score each email and advertisement against the student's profile. | Must |
| FR-24 | The system shall label items as "For you" or "Probably not for you" and show a "For you" list ranked by score. | Must |
| FR-25 | The system shall show a short reason for each recommendation (e.g. "Matches your skill: Python"). | Should |
| FR-26 | The system shall let students without a CV build a profile manually. | Should |

### 4.5 Community advertisement board

| ID | Requirement | Priority |
|---|---|---|
| FR-27 | The system shall let an organisation apply for a verified organisation account. | Must |
| FR-28 | The system shall let a verified organisation create, edit and delete posts with title, description, category, date, venue, deadline, link and an optional image. | Must |
| FR-29 | The system shall show a public board of approved posts to all signed-in students. | Must |
| FR-30 | The system shall let students filter board posts by category, date and faculty/field. | Must |
| FR-31 | The system shall let students save (bookmark) posts. | Should |
| FR-32 | The system shall let organisations set a target field or audience for a post, used by the recommender. | Should |
| FR-33 | The system shall show organisations simple post statistics (views and saves). | Could |

### 4.6 Deadline reminders and notifications

| ID | Requirement | Priority |
|---|---|---|
| FR-34 | The system shall place extracted deadlines from emails and saved posts on an in-app calendar. | Should |
| FR-35 | The system shall send push notifications before a deadline (e.g. 3 days and 1 day before). | Should |
| FR-36 | The system shall let the student turn notifications on or off per segment. | Could |

### 4.7 Administration

| ID | Requirement | Priority |
|---|---|---|
| FR-37 | The system shall let an administrator approve or reject organisation account applications. | Must |
| FR-38 | The system shall let an administrator moderate board posts (approve, hide, remove). | Must |
| FR-39 | The system shall let students report inappropriate posts, which are flagged for admin review. | Should |
| FR-40 | The system shall let an administrator add, rename or remove email segment categories. | Should |
| FR-41 | The system shall show an admin dashboard with usage reports (active users, emails classified, posts, LLM cost). | Should |

---

## 5. Non-functional requirements

### 5.1 Privacy and security

| ID | Requirement | Priority |
|---|---|---|
| NFR-01 | The system shall comply with Malaysia's Personal Data Protection Act 2010 (PDPA), including a clear privacy notice shown before mailbox consent. | Must |
| NFR-02 | The system shall request only the minimum Microsoft Graph permissions needed (read-only mail, basic profile). No send, delete or modify permissions. | Must |
| NFR-03 | The system shall encrypt email content and CVs at rest (e.g. AES-256) and all traffic in transit (HTTPS/TLS 1.2+). | Must |
| NFR-04 | The system shall use email content only for classification and recommendation, never for advertising, sale or model training by third parties. | Must |
| NFR-05 | The system shall permanently delete a student's data within 7 days of account deletion or disconnection. | Must |
| NFR-06 | The system shall store OAuth tokens securely and never expose them to the client app. | Must |
| NFR-07 | The system shall restrict admin and organisation functions by role-based access control. | Must |
| NFR-08 | The system shall operate only after UM IT grants tenant approval for the app in the UM Microsoft 365 tenant. | Must |

### 5.2 Performance (speed)

| ID | Requirement | Priority |
|---|---|---|
| NFR-09 | The inbox view shall load within 3 seconds on a normal 4G or campus Wi-Fi connection. | Must |
| NFR-10 | A new email shall appear in the app, classified, within 5 minutes of arriving in Siswamail. | Should |
| NFR-11 | CV parsing and profile extraction shall complete within 30 seconds of upload. | Should |
| NFR-12 | The system shall support at least 500 concurrent users during the pilot and launch without noticeable slowdown. | Should |

### 5.3 Compatibility (browsers and devices)

| ID | Requirement | Priority |
|---|---|---|
| NFR-13 | The web app shall work on the latest two versions of Chrome, Edge, Firefox and Safari. | Must |
| NFR-14 | The mobile app shall run on Android 10 or later (Google Play). | Must |
| NFR-15 | iOS users shall be able to use the full feature set through the responsive web app on Safari. | Must |
| NFR-16 | The web app shall be responsive from 360 px (phone) to desktop widths. | Must |

### 5.4 Accuracy (AI quality)

| ID | Requirement | Priority |
|---|---|---|
| NFR-17 | The LLM shall classify emails into the correct segment with at least 85% accuracy, measured on a labelled test set of UM emails. | Must |
| NFR-18 | UM Official Notices shall be recalled with at least 95% accuracy (they must not be hidden in "Not for me"). | Must |
| NFR-19 | Deadline extraction shall be correct for at least 90% of emails that contain a deadline. | Should |
| NFR-20 | At least 70% of pilot students shall rate their "For you" recommendations as relevant. | Should |

### 5.5 Usability, reliability and cost

| ID | Requirement | Priority |
|---|---|---|
| NFR-21 | A new student shall be able to sign in, connect Siswamail and see sorted mail within 2 minutes without help. | Must |
| NFR-22 | The interface shall be in English and follow basic accessibility practice (readable contrast, labelled buttons). | Should |
| NFR-23 | The system shall be available at least 99% of the time during the semester, excluding planned maintenance. | Should |
| NFR-24 | If the LLM service is down, the system shall still show the inbox and classify pending emails once it recovers. | Should |
| NFR-25 | LLM usage shall stay within the budget of about RM 150 per month by classifying each email once and using a low-cost model. | Must |
| NFR-26 | The code shall be kept in GitHub with documented setup so new team members can run it locally. | Could |

---

## 6. Traceability: feature to requirement

| Feature (ISP section III) | Functional requirements |
|---|---|
| 1. Siswamail single sign-on | FR-01 – FR-06 |
| 2. Live inbox view | FR-07 – FR-12 |
| 3. AI segmentation | FR-13 – FR-17 |
| 4. Community advertisement board | FR-27 – FR-33 |
| 5. CV-based profile | FR-20 – FR-22, FR-26 |
| 6. Personalised recommendations | FR-23 – FR-25 |
| 7. Deadline reminders | FR-34 – FR-36 |
| 8. Feedback loop | FR-18, FR-19 |
| 9. Admin dashboard | FR-37 – FR-41 |

Every feature in the ISP maps to at least one requirement ID.

## 7. Summary

| Type | Must | Should | Could | Total |
|---|---|---|---|---|
| Functional | 25 | 12 | 4 | 41 |
| Non-functional | 17 | 8 | 1 | 26 |

## 8. Team review

| Member | Role | Comments | Agreed (Y/N) |
|---|---|---|---|
| | Project Manager | | |
| | System Analyst | | |
| | UI/UX Designer and QA Tester | | |
| | Full-Stack Developer | | |
| | Full-Stack Developer | | |
| | AI / LLM Engineer (DevOps) | | |

**Done when:** every feature has a requirement ID that the team agreed on.
