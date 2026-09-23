# Security Specification - Household Chore Tracker

## Data Invariants
1. A Member must belong to a valid Household.
2. A Task or Log must be associated with a valid Household.
3. Only the Admin (identified by email) can modify global household settings.
4. Users can log chores and update their own profiles (within limits).

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create a household doc with someone else as owner.
2. **Privilege Escalation**: Attempt to update own role to 'admin' in the members collection.
3. **Data Injection**: Injecting a 1MB string into the `notes` field of a log.
4. **Invalid State**: Setting `stars` to 5 (only 1-3 allowed).
5. **Orphaned Writes**: Creating a task without a corresponding household.
6. **Timeline Tampering**: Setting a `timestamp` in the future or manually overriding `updatedAt`.
7. **Cross-Household Access**: Trying to read logs of `household_B` while only being a member of `household_A`.
8. **Shadow Field Injection**: Adding `isSuperAdmin: true` to a member document.
9. **Unauthorized Deletion**: A non-admin user trying to delete a task they didn't create.
10. **Target Manipulation**: Setting `base_points` of a task to 1,000,000.
11. **Email Spoofing**: Accessing data by claiming to be the admin email without verification.
12. **Bulk Extraction**: Trying to list all households in the system.

## Proposed Rules Logic
- `isSignedIn()`: Basic auth check.
- `isAdmin()`: Check if `request.auth.token.email` is the predefined admin.
- `isValidHousehold()`, `isValidMember()`, `isValidTask()`, `isValidLog()`: Per-entity validation helpers.
- `isMemberOf(householdId)`: Check if the user has access to the household. (Initially, we'll keep it simple: any signed in user can access the 'main_household' to avoid onboarding blocks, but we will harden it so only the owner can change settings).
