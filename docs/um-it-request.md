# Request to UM IT: Microsoft 365 app access for UM MailSense

**Owner:** Iqbal (W1-PM-04, due 27 Oct) · **Inputs:** Nazifa (requirements summary), Raihan (W1-BE-01, app registration)

## Summary
UM MailSense is a student group project at Universiti Malaya. It helps students sort their Siswamail
inbox into segments (official notices, hackathons, research opportunities, events) and recommends
programmes based on their CV.

## What we ask for
Permission for UM students to grant our app **read-only** access to **their own** mailbox.

| Item | Value |
|---|---|
| Application (client) ID | (Raihan to fill in) |
| Redirect URI (dev) | `http://localhost:8000/api/v1/auth/callback` |
| Redirect URI (production) | (fill in at deployment) |
| Delegated permissions | `User.Read`, `Mail.Read`, `offline_access` |
| Application permissions | None |

## Data protection (PDPA 2010)
- Read-only; the app never sends, deletes or changes email.
- Each student consents individually and can disconnect at any time; their data is then deleted.
- Email content is used only to classify and recommend, and is not shared.
- Data stored encrypted on a server in (region to fill in); all traffic over HTTPS.

## Contact
Bari Iqbal Ibn Abdul (24221395), Project Manager
