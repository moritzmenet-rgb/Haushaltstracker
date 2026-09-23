# Security Specification - Remix Household Chore Tracker

## Data Invariants
1. A household settings document must exist to have members, tasks, and logs.
2. Only authenticated users can access any data.
3. Users specifically listed in `allowed_emails` or identified as 'moritz.menet.bfsu@gmail.com' have full access.
4. Tasks and logs must belong to a valid household.
5. Logs must reference a valid user and task.

## The "Dirty Dozen" Payloads
1. **Unauthenticated Read**: Attempt to read `/households/main_household` without a token. (DENIED)
2. **Unauthorized Household Create**: Random user tries to create a new household. (DENIED)
3. **Identity Spoofing**: User A tries to log a chore for User B. (DENIED - currently app allows it, but rules should restrict if possible. For this specific app, it's a shared family device model, so maybe not too strict on *which* user logs, but *who* is logged in to Firebase).
4. **Admin Escalation**: Regular user tries to update their own role to 'admin' in the `members` collection. (DENIED)
5. **Setting Wipeout**: Unauthorized user tries to delete the household settings. (DENIED)
6. **Task Injection**: User tries to create a task with 1MB of junk data in the title. (DENIED)
7. **Negative Points**: User tries to log a chore with negative points awarded. (DENIED)
8. **Future Log**: User tries to log a chore with a timestamp in the year 2099. (DENIED)
9. **Email Spoofing**: User with unverified email tries to access admin data. (DENIED)
10. **Orphaned Log**: User tries to create a log for a task that doesn't exist. (DENIED)
11. **Shadow Field Update**: User tries to add a `isDeveloper: true` field to their member profile. (DENIED)
12. **Foreign Household Write**: User tries to write to `/households/other_household` when they only have access to `main_household`. (DENIED)

## Rules Implementation Strategy
- Use `isValidId` for all path variables.
- Use `isValidHousehold`, `isValidMember`, `isValidTask`, `isValidLog` helpers.
- Enforce `request.auth.token.email_verified == true`.
- Enforce `allowed_emails` check for the household.
