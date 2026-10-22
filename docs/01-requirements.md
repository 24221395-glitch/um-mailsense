# 01 · Requirements Specification

**Owner:** Nazifa · **Tasks:** W1-SA-01 (survey, due 25 Oct), W1-SA-02 (spec, due 26 Oct) · **Status:** DRAFT

## 1. Survey summary
<!-- Google Form link, number of responses (target 30+), top findings with numbers -->
- Form link:
- Responses: students ___ · club committees ___
- Key findings:

## 2. Users
| User | Description |
|---|---|
| Student | Any UM student with a Siswamail (@siswa.um.edu.my) account |
| Organisation | Verified club, society or faculty unit that posts programmes |
| Admin | Project team member who approves organisations and moderates posts |

## 3. Functional requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Student signs in with Siswamail (Microsoft single sign-on); no separate password | Must |
| FR-02 | System syncs the student's Siswamail inbox (read-only) at least every 10 minutes | Must |
| FR-03 | Every email is classified into one segment: UM Notice, Hackathon & Competition, Research, Events & Programmes, Scholarships & Careers, Club & Community, Not for me | Must |
| FR-04 | System extracts deadline, venue, organiser and link from an email where present | Must |
| FR-05 | Student can move an email to another segment; the correction is saved | Must |
| FR-06 | Student uploads a PDF CV; system extracts field of study, skills and interests, which the student can edit | Must |
| FR-07 | Emails and ads are labelled "For you" or "Probably not for you" from the profile | Must |
| FR-08 | Organisations register and, after admin approval, post programmes to a public ad board | Must |
| FR-09 | Students browse, filter and save ads | Should |
| FR-10 | Extracted deadlines appear on a calendar with browser notifications | Should |
| FR-11 | Admin approves or rejects organisations and removes posts | Must |
| FR-12 | Admin sees usage numbers (users, emails classified, ads) | Could |

## 4. Non-functional requirements
| ID | Requirement |
|---|---|
| NFR-01 | Read-only mail access; student can disconnect at any time and their data is deleted |
| NFR-02 | Complies with Malaysia's PDPA 2010; email content is not used for any other purpose |
| NFR-03 | All traffic over HTTPS; secrets never in the repository |
| NFR-04 | Pages load in under 3 seconds on a phone on campus Wi-Fi |
| NFR-05 | Works in current Chrome, Edge, Safari and Firefox on phone and laptop |
| NFR-06 | Classifier accuracy at least 85% on the labelled test set |
| NFR-07 | Each email is sent to the LLM at most once (cost control) |
