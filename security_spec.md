# Security Specification - Remix Household Chore Tracker

## Data Invariants
1. **Household Integrity**: A household document must have a `household_name` and a `categories` list.
2. **Member Ownership**: Members, Tasks, and Logs always belong to a specific `householdId`.
3. **Role Enforcement**: Only 'admin' or 'member' roles are allowed. 'admin' role can only be assigned by existing admins or during initial setup (for Moritz).
4. **Point Integrity**: Points awarded in a log must be positive and within reasonable bounds.
5. **PII Protection**: User email and PIN codes must be protected. PIN codes are used for local profile switching security.

## The Dirty Dozen Payloads (Fail Cases)
1. **ID Poisoning**: Attempt to create a household with a 2KB junk string as ID.
2. **Identity Spoofing**: Attempt to create a member profile with `role: 'admin'` as a non-admin user.
3. **Shadow Field Injection**: Attempt to add `is_super_admin: true` to a member document.
4. **State Shortcutting**: Attempt to update a log's `points_awarded` to 1,000,000.
5. **Cross-Household Leak**: Attempt to read logs from `households/other_family/logs` as a member of `main_household`.
6. **Immutable Violation**: Attempt to change the `householdId` of a task after it has been created.
7. **Type Poisoning**: Sending `base_points: "lots"` (string) instead of an integer.
8. **Size Attack**: Sending a `title` string that is 500KB in size.
9. **Orphaned Record**: Creating a log for a `task_id` that does not exist.
10. **Admin Privilege Escalation**: A 'member' attempting to update the `allowed_emails` list in the household settings.
11. **PII Leak**: An unauthenticated user attempting to list all `members` of a household.
12. **Timestamp Fraud**: Sending a `timestamp` in the future for a chore log.

## Security Controls
- **Auth Guard**: All writes require `isSignedIn()`.
- **Relational Sync**: Sub-resource access is gated by the parent household's membership/access.
- **Validation Blueprints**: Strict schema validation using `isValidHousehold`, `isValidMember`, `isValidTask`, and `isValidLog`.
- **Action-Based Updates**: Partitioned update logic using `affectedKeys().hasOnly()`.
