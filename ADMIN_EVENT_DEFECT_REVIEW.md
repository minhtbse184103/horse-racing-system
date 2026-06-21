# Admin Event Module — Defect Review

**Date:** 2026-06-21
**Branch:** feature/admin-event-complete-huy
**Scope:** Tournament CRUD · Race CRUD · Registration Review · RaceEntry Assignment · Referee Assignment · Venue Image Upload · Prize Split Configuration

---

## Summary

| Severity  | Count |
|-----------|-------|
| Critical  | 4     |
| High      | 9     |
| Medium    | 12    |
| Low       | 5     |
| **Total** | **30** |

---

## Critical

---

### C-01 — Any authenticated user can update or cancel a tournament

**Severity:** Critical
**Location:** `TournamentController.java:81-111`, `TournamentService.java:162-209`

**Description:**
`updateTournament` and `cancelTournament` accept no `Authentication` parameter, and `TournamentService.updateTournament()` never calls `getAdmin()`. There is no role check on the update or cancel paths. Any authenticated user with a valid JWT token can rewrite tournament fields or cancel a tournament.

Compare with `createTournament` (line 65-79) and `uploadVenueImage` (line 41-52), which both correctly pass `authentication.getName()` to the service for role verification. The update and cancel endpoints silently skip this step.

**Reproduction:**
1. Log in as a non-admin user (OWNER or JOCKEY role) and obtain a JWT token.
2. Send `PUT /api/tournaments/{id}` with a modified payload — the request succeeds.
3. Send `DELETE /api/tournaments/{id}` — the tournament is cancelled.

**Recommended Fix:**
Add `Authentication authentication` to both controller methods and pass `authentication.getName()` into the service. Add a `getAdmin(adminEmail)` call inside `updateTournament()` in the service, mirroring the pattern in `createTournament()`.

---

### C-02 — All Race state-mutation endpoints are unauthenticated and role-unguarded

**Severity:** Critical
**Location:** `RaceController.java:43-79`, `RaceService.java` (all mutating methods)

**Description:**
`createRace`, `updateRace`, `closeRegistration`, `completeRace`, and `cancelRace` in `RaceController` accept no `Authentication` parameter. The service layer methods (`RaceService`) perform no admin check at all. Any authenticated user can create races, change race statuses, or cancel races.

**Reproduction:**
1. Log in as OWNER and obtain a JWT token.
2. Send `DELETE /api/races/{id}` — race is cancelled with no admin authorization.
3. Send `PUT /api/races/{id}/complete` — race is marked complete.

**Recommended Fix:**
Add `Authentication authentication` to each mutating endpoint. Add an admin lookup (similar to `getAdmin()` in other services) in `RaceService`, or use `@PreAuthorize("hasRole('ADMIN')")` at the controller level.

---

### C-03 — Payment status update has no authorization check

**Severity:** Critical
**Location:** `AdminRegistrationController.java:66-74`, `AdminRegistrationService.java:178-212`

**Description:**
`PUT /api/admin/registrations/{id}/payment-status` accepts no `Authentication` parameter, and `AdminRegistrationService.updatePaymentStatus()` never calls `getAdmin()`. Any authenticated user can set a registration's payment status to PAID, REFUNDED, FAILED, or UNPAID — bypassing the entry fee payment requirement that guards race entry assignment.

**Reproduction:**
1. Log in as any authenticated user.
2. Find a PENDING registration.
3. Send `PUT /api/admin/registrations/{id}/payment-status` with `{"paymentStatus":"PAID"}`.
4. The registration's payment status is updated to PAID, allowing it to be approved and assigned.

**Recommended Fix:**
Add `Authentication authentication` to the controller endpoint and call `getAdmin(authentication.getName())` inside `updatePaymentStatus()`, matching the pattern in `approveRegistration()` and `rejectRegistration()`.

---

### C-04 — All Referee Assignment endpoints are unauthenticated and role-unguarded

**Severity:** Critical
**Location:** `AdminRefereeAssignmentController.java:26-69`, `RefereeAssignmentService.java` (all mutating methods)

**Description:**
`createAssignment`, `replaceAssignment`, and `removeAssignment` in `AdminRefereeAssignmentController` accept no `Authentication` parameter. `RefereeAssignmentService` performs no admin role check. Any authenticated user can assign or remove referees. This is inconsistent with `AdminRaceEntryController`, which correctly uses `authentication.getName()` for admin verification.

**Reproduction:**
1. Log in as a non-admin user.
2. Send `POST /api/admin/referee-assignments` with a valid `raceId` and `refereeUserId`.
3. Assignment is created without any authorization.

**Recommended Fix:**
Add `Authentication authentication` to all mutating endpoints. Add `getAdmin(adminEmail)` validation in service methods, or use `@PreAuthorize("hasRole('ADMIN')")` at class level on the controller.

---

## High

---

### H-01 — cancelTournament does not cancel RaceEntry records

**Severity:** High
**Location:** `TournamentService.java:211-234`

**Description:**
When a tournament is cancelled, all its races are marked `CANCELLED` (line 225-227). However, any `RaceEntry` records with status `ASSIGNED` for those races are not updated. They remain in the database as `ASSIGNED` entries referencing cancelled races.

Downstream queries such as `getAssignmentQueue()` (which filters for unassigned registrations) use `existsByRegistrationIdAndStatus(ASSIGNED)` to determine assignment state. An orphaned `ASSIGNED` entry on a cancelled race would incorrectly mark those registrations as already assigned, blocking them from being assigned to a new race if the tournament is recreated or re-run.

**Reproduction:**
1. Create a tournament with a race and assign registrations to it.
2. Cancel the tournament via `DELETE /api/tournaments/{id}`.
3. Query `GET /api/admin/race-entries/assignment-queue` — assigned registrations from the cancelled tournament do not appear in the queue.

**Recommended Fix:**
After cancelling races, add a step to bulk-cancel all `ASSIGNED` `RaceEntry` rows for those races (with a system cancellation reason), or cascade the cancel via the repository.

---

### H-02 — validateTournamentCanBeModified blocks cancellation when any registration exists

**Severity:** High
**Location:** `TournamentService.java:319-336`, called from `cancelTournament()` at line 220

**Description:**
`validateTournamentCanBeModified()` throws `CONFLICT` if `registrationRepository.existsByTournamentId(tournamentId)` is true — regardless of registration status. This means a tournament with even a single `REJECTED` or `CANCELLED` registration cannot be cancelled. The method is reused for both edit and cancel paths, but the business rule for cancellation should be less restrictive (e.g., only block if `APPROVED` registrations exist or if entries are assigned).

**Reproduction:**
1. Create a tournament.
2. Submit one registration and reject it.
3. Attempt to cancel the tournament via `DELETE /api/tournaments/{id}`.
4. The request fails with "Tournament cannot be modified after registrations exist."

**Recommended Fix:**
Extract separate validation for cancel vs. edit. Cancel should allow proceeding if no `APPROVED` registration exists (or no `ASSIGNED` race entries exist), rather than blocking on any registration record.

---

### H-03 — completeTournament allows skipping OPEN_FOR_REGISTRATION → REGISTRATION_CLOSED → IN_PROGRESS states

**Severity:** High
**Location:** `TournamentService.java:271-317`

**Description:**
`completeTournament()` only blocks if status is `CANCELLED` or already `COMPLETED`. It does not enforce that the tournament passed through `IN_PROGRESS`. A tournament with status `OPEN_FOR_REGISTRATION` can be completed as long as all its races are `COMPLETED` (which can happen via the auto-refresh on `getRaceById`). This violates the documented state machine and could leave a tournament in an inconsistent state where it skipped the `REGISTRATION_CLOSED` and `IN_PROGRESS` statuses.

**Reproduction:**
1. Create a tournament with one race.
2. Advance time past the race start time (or directly trigger `GET /api/races/{id}` which auto-sets the race to `IN_PROGRESS`).
3. Complete the race via `PUT /api/races/{id}/complete`.
4. Call `PUT /api/tournaments/{id}/complete` — succeeds even though tournament was never manually transitioned through its states.

**Recommended Fix:**
Add a guard: `if (!EventStatus.IN_PROGRESS.equals(tournament.getStatus())) { throw ApiException(CONFLICT, "...") }` before the races check.

---

### H-04 — updateTournamentToInProgress uses non-locking read under concurrent load

**Severity:** High
**Location:** `RaceService.java:358-372`

**Description:**
`refreshRaceStatus()` (line 346-356) locks the Race with `findByIdForUpdate` before updating its status, but when it then calls `updateTournamentToInProgress()` (line 354), that method fetches the Tournament using `findById()` (line 359) — a non-locking query. Under concurrent requests (e.g., two races in the same tournament both transitioning to `IN_PROGRESS` simultaneously), both threads can read the Tournament as `REGISTRATION_CLOSED`, both pass the guard on lines 365-367, and both attempt to `save()` the tournament as `IN_PROGRESS`. This causes unnecessary duplicate writes and may mask lost-update bugs if the save logic is ever extended.

**Recommended Fix:**
Use `tournamentRepository.findByIdForUpdate(tournamentId)` inside `updateTournamentToInProgress()`, consistent with how the Race is locked.

---

### H-05 — getAllRaces and getRaceById are @Transactional (write) and perform N writes per call

**Severity:** High
**Location:** `RaceService.java:52-64`, `RaceService.java:474-477`

**Description:**
`getAllRaces()` and `getRaceById()` are annotated `@Transactional` (not `readOnly = true`) because `refreshAndMap()` calls `refreshRaceStatus()`, which may call `raceRepository.save()` and then `updateTournamentToInProgress()` which calls `tournamentRepository.save()`. A read request (`GET /api/races`) can trigger N race saves plus M tournament saves for all races whose start time has passed. This is write-amplification on a read endpoint.

Additionally, `getAllRaces()` cannot benefit from read-replicas and will cause unnecessary write locks.

**Recommended Fix:**
Separate the status-refresh concern from reads. Either schedule a background job to auto-transition statuses, or apply lazy refresh only on explicit mutation endpoints, not on GET endpoints.

---

### H-06 — loadTournaments performs N+1+N API calls on every workspace load

**Severity:** High
**Location:** `useTournamentWorkspace.js:42-80` (frontend)

**Description:**
`loadTournaments()` fetches all tournament summaries, then for each tournament calls `getTournamentById(tournamentId)` AND `getRacesByTournament(tournamentId)` in parallel. For N tournaments, this sends `1 + 2N` HTTP requests on every page load or reload. At 20 tournaments, that is 41 sequential-then-parallel requests, creating a waterfall that significantly delays workspace rendering.

**Reproduction:**
Open the admin event workspace with 20+ tournaments and observe the Network tab — a cascade of `GET /api/tournaments/{id}` and `GET /api/races/by-tournament/{id}` requests.

**Recommended Fix:**
The `GET /api/tournaments` list endpoint already returns all summary data. `GET /api/tournaments/{id}` adds only a `races` array. Consider enriching `TournamentResponse` to include races, or add a dedicated endpoint that returns all tournaments with their races in a single call.

---

### H-07 — Venue image file is stored to disk before the DB transaction commits

**Severity:** High
**Location:** `TournamentService.java:87-94`, `VenueImageStorageService.java:37-55`

**Description:**
In `uploadVenueImage()`, `venueImageStorageService.store(file)` writes the new file to disk on line 88. The tournament is then saved on line 91. If the DB save fails (e.g., constraint violation, connection loss), the transaction rolls back but the file remains on disk — permanently orphaned. Disk storage and DB updates are not coordinated.

The reverse failure is also true: if `venueImageStorageService.delete(previousImageUrl)` throws on line 92 (inside the `@Transactional` boundary), Spring rolls back the DB update but the new file is already on disk and the old file was not yet deleted. The tournament in the DB still points to the old URL, but the new file occupies storage.

**Reproduction:**
1. Upload a venue image.
2. Simulate a DB failure after file write (e.g., kill connection).
3. The file on disk is orphaned — no record in the DB points to it and it is never cleaned up.

**Recommended Fix:**
Store the file after the DB record is committed (e.g., use `@TransactionalEventListener(phase = AFTER_COMMIT)`), or implement a cleanup job that deletes unreferenced files. Keep the old image URL until the new save is committed, then delete asynchronously.

---

### H-08 — updateTournamentProgramme (frontend) cancels races before verifying all updates succeed

**Severity:** High
**Location:** `tournamentPersistenceService.js:55-112` (frontend)

**Description:**
In `updateTournamentProgramme()`, the service:
1. Updates the tournament.
2. Updates/creates each race in the new draft sequentially.
3. Cancels any races removed from the draft (lines 85-96).

If step 2 fails halfway (e.g., Race 3 of 5 fails to update), the error is thrown and races removed from the draft have NOT been cancelled yet, leaving the UI in an inconsistent state. If instead step 3 fails (a cancel fails), the tournament and races were already updated successfully, but the wizard throws an error with no `partialTournamentId`, so the workspace doesn't reload or expand to show the partial result. The user sees an error but the data is partially changed.

**Recommended Fix:**
Always reload tournaments on any error in `updateTournamentProgramme`. In `saveTournament()` (useTournamentWorkspace.js:213-234), ensure `loadTournaments()` is called in the `finally` block, not just the catch path. Also set `expandedId` on partial update errors.

---

### H-09 — getAssignmentQueue and getAllAssignments return unbounded lists

**Severity:** High
**Location:** `RaceEntryService.java:57-67`, `RefereeAssignmentService.java:158-164`

**Description:**
`getAssignmentQueue()` returns all approved, unassigned registrations across all tournaments. `getAllAssignments()` returns all referee assignments via `assignmentRepository.findAll()`. Neither supports pagination. In a production environment with thousands of registrations or assignments, these endpoints will return massive payloads, risking OOM on the server and slow renders on the client.

**Recommended Fix:**
Accept a `Pageable` parameter and return `Page<T>`, or at minimum filter by tournament and impose a reasonable `LIMIT` at the query level.

---

## Medium

---

### M-01 — Race prize delete-then-save in updateRace swallows original DataIntegrityViolationException

**Severity:** Medium
**Location:** `RaceService.java:233-246`

**Description:**
In `updateRace()`, prizes are deleted and then new prizes are saved inside the same `try` block. If `savePrizes()` throws a `DataIntegrityViolationException`, the catch on line 241 wraps it into a generic `ApiException` with message "Race name, order, or prize rank conflicts." The original exception (which may actually be a different constraint, not prize rank) is discarded without logging. This makes it impossible to diagnose the true cause of the failure from logs.

**Recommended Fix:**
Log the original exception before rethrowing: `log.warn("DataIntegrityViolationException during race update", exception)`.

---

### M-02 — approvedRegistrationCount uses List.of(APPROVED) — redundant wrapping

**Severity:** Medium
**Location:** `TournamentService.java:623-627`, `TournamentService.java:662-667`

**Description:**
`registrationRepository.countByTournamentIdAndApprovalStatusIn(tournamentId, List.of(RegistrationStatus.APPROVED))` is called in both `toResponse()` and `toDetailResponse()`. The repository method uses `IN (...)` but is being called with a single-element list. This is functionally correct but semantically misleading — the method appears to accept multiple statuses when only one is ever passed. More importantly, both response builders make this call separately, duplicating the query for every tournament listed.

**Recommended Fix:**
Use a dedicated `countByTournamentIdAndApprovalStatus(tournamentId, APPROVED)` query that avoids `IN`.

---

### M-03 — toCandidateResponse and toResponse in RaceEntryService each run N individual DB queries

**Severity:** Medium
**Location:** `RaceEntryService.java:369-491`

**Description:**
For each `RaceEntry` or candidate, `toResponse()` and `toCandidateResponse()` issue up to 5–6 individual `findById()` / `findByRegistrationIdAndStatus()` queries (tournament, horse, owner, jockey, assignedBy, raceEntry, race). With 100 entries in a race, `getEntriesByRace()` issues up to 600 DB queries.

**Recommended Fix:**
Use JOIN FETCH queries at the repository level to load related entities in a single query, or introduce projection/DTO queries.

---

### M-04 — toUserResponse in RefereeAssignmentService dereferences role without null check

**Severity:** Medium
**Location:** `RefereeAssignmentService.java:331-340`

**Description:**
`toUserResponse(User user)` calls `user.getRole().getRoleName()` on line 338 without checking if `user.getRole()` is null. While referees are validated to have a non-null role during assignment, `getActiveReferees()` (line 181-190) fetches by status and role name and is subject to any edge case where the role is somehow null. A NullPointerException here would expose a 500 error to the caller.

**Reproduction:**
Query `GET /api/admin/referee-assignments/referees` if any ACTIVE user with REFEREE role name has a null Role FK.

**Recommended Fix:**
Add a null guard: `user.getRole() != null ? user.getRole().getRoleName() : null`.

---

### M-05 — AdminRegistrationService.toResponse issues N+1 queries per registration

**Severity:** Medium
**Location:** `AdminRegistrationService.java:261-376`

**Description:**
`toResponse()` loads tournament, horse, owner, jockey (optional), reviewer (optional), raceEntry (optional), and race (optional) with individual `findById()` calls — up to 7 queries per registration. `getRegistrations()` (line 66-91) maps all registrations through `toResponse()`, causing up to 7N queries for a list of N registrations.

**Recommended Fix:**
Batch-load related entities before mapping, or use a JPQL/Native query with JOINs and a result mapper.

---

### M-06 — Frontend race time boundary validated by date-string slice, not full datetime

**Severity:** Medium
**Location:** `wizardValidation.js:35-45`

**Description:**
The race schedule validation compares `race.raceStartTime.slice(0, 10)` (a date string like `"2024-01-31"`) against `draft.start` and `draft.end`. This checks only the date portion. A race starting at `23:58` on the tournament start day and ending at `00:30` the next day (i.e., `raceEndTime.slice(0, 10) > draft.end` is false) passes frontend validation but may represent an overnight race that crosses into the next calendar day, confusing the admin. The backend allows it too (only checks `raceEndTime < tournamentEnd + 1 day at midnight`), so a race ending at 23:59 on the last tournament day is valid in both layers, but a race ending at 00:01 the day after is blocked only by the backend.

**Recommended Fix:**
Validate full ISO datetime strings, not just the date slice, to ensure the frontend and backend share the same boundary semantics and the admin sees an accurate error earlier.

---

### M-07 — Wizard step 1 allows maxRegistration below the minimum of 1 in the backend

**Severity:** Medium
**Location:** `wizardValidation.js:11`, `CreateTournamentRequest.java:41-43`

**Description:**
The frontend wizard step 1 validation (line 11) enforces `maxRegistration >= 3`. The backend DTO enforces `@Min(value = 1, ...)`. The constraints are inconsistent — a value of 1 or 2 passes the backend but the frontend rejects it. More importantly, the frontend minimum of 3 has no corresponding backend check in the service layer; `RegistrationEligibilityService` will accept any `maxRegistrations >= 1` from the DB.

**Recommended Fix:**
Align the minimum to 3 in the backend DTO (`@Min(value = 3)`) or reduce the frontend minimum to 1 to match backend semantics.

---

### M-08 — openClone shallow-copies race prizes; wizard mutations can corrupt original object

**Severity:** Medium
**Location:** `useTournamentWorkspace.js:191-211`

**Description:**
`openClone()` spreads each race but does not deep-clone the `prizes` array or its prize objects. The cloned tournament draft shares prize object references with the original tournament in state. If the wizard modifies a prize's `ownerPercent` before the draft is committed, the in-memory original tournament's prize is mutated too. Because `prizes` is subsequently mapped by `createInitialTournamentDraft()` in `wizardHelpers.js` with `(prize) => ({ ...prize })` (shallow clone), nested fields would still be shared if prizes contained nested objects, but as the current prize shape is flat, this is a latent bug waiting for a structural change to prizes.

**Recommended Fix:**
Deep-clone prizes in `openClone()`: `prizes: (race.prizes || []).map((p) => ({ ...p }))`.

---

### M-09 — cancelEntry race status is read without a lock

**Severity:** Medium
**Location:** `RaceEntryService.java:205-226`

**Description:**
In `cancelEntry()`, the `RaceEntry` is fetched with `findByIdForUpdate()` (line 192), but the associated `Race` is loaded with plain `findById()` on line 205. The check `now.isBefore(race.getRaceStartTime())` (line 221) could read a stale value if another transaction concurrently updates the race's start time. The race start time is not immutable after assignment (it can be changed via `updateRace()`), so reading it without a lock may produce a stale result.

**Recommended Fix:**
Use `raceRepository.findByIdForUpdate(entry.getRaceId())` when loading the Race inside `cancelEntry()`.

---

### M-10 — validateTournamentDates blocks creating tournaments with registration opening in the past

**Severity:** Medium
**Location:** `TournamentService.java:338-378`, specifically lines 372-377

**Description:**
`validateTournamentDates()` rejects any `registrationCloseAt` that is in the past (line 372-377). However it does NOT reject `registrationOpenAt` being in the past. Separately, line 365 rejects `startDate` in the past. This means an admin can create a tournament whose registration window opened in the past (e.g., `registrationOpenAt = yesterday`) as long as `registrationCloseAt` is in the future. Owners could then immediately submit registrations. This is likely intentional for backdated entry, but the intent is not documented.

The more important issue: `startDate.isBefore(LocalDate.now())` at line 365 uses the server's local date. If the server is in a different timezone than the business, edge-case dates (e.g., late evening submissions) may fail or pass unexpectedly.

**Recommended Fix:**
Use `LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))` or configure a global clock bean to ensure consistent timezone usage.

---

### M-11 — updateTournamentProgramme update path races without partial recovery

**Severity:** Medium
**Location:** `tournamentPersistenceService.js:55-112` (frontend)

**Description:**
If `updateRace()` fails for one race (line 75-82), the error thrown has no `partialTournamentId` field. The `saveTournament()` handler in `useTournamentWorkspace.js` only sets `expandedId` and closes the wizard when `error.partialTournamentId` exists (lines 227-231). For update failures, `loadTournaments()` is called in the catch block (line 225), but the wizard stays open and no `expandedId` is set, so the user cannot see which tournament was partially updated.

**Recommended Fix:**
Set `partialTournamentId = draft.id` in the error thrown by `updateTournamentProgramme()` failures, so the workspace can highlight the partially updated tournament.

---

### M-12 — BETWEEN condition for numeric type converts value to BigDecimal then strips trailing zeros

**Severity:** Medium
**Location:** `TournamentService.java:536-543`

**Description:**
For non-GENDER conditions with a single `value` (EQ, GT, GTE, LT, LTE operators), the value is stored as `new BigDecimal(value.trim()).stripTrailingZeros().toPlainString()`. `stripTrailingZeros()` converts `"5.00"` to `"5"` and `"5.50"` to `"5.5"`. When `RegistrationEligibilityService` parses this value back (line 453-460), it uses `new BigDecimal(condition.getValue())` — this is safe since `"5"` parses fine. However the problem arises at display: the UI showing `"5"` instead of `"5.00"` can confuse admins who entered weight in kg with decimal precision.

**Recommended Fix:**
Store the value as-entered (just `trim()`'d), and normalize only at comparison time in `RegistrationEligibilityService`. Or consistently store with scale: `new BigDecimal(value.trim()).setScale(2, RoundingMode.HALF_UP).toPlainString()`.

---

## Low

---

### L-01 — Deprecated getStatus/setStatus methods in Registration entity remain in codebase

**Severity:** Low
**Location:** `backend/src/main/java/com/example/backend/entity/Registration.java` (deprecated getters/setters for `status`)

**Description:**
The `Registration` entity has `@Deprecated getStatus()` / `setStatus()` delegating to `approvalStatus`. These exist for backward compatibility but no code path should be using them. Their presence creates confusion about which field is canonical, and any new code might accidentally call the deprecated version.

**Recommended Fix:**
Verify no callers remain (grep for `.getStatus()` / `.setStatus()` on Registration), then remove the deprecated methods.

---

### L-02 — createRace() in wizardHelpers.js defaults all new races to 09:00–10:00

**Severity:** Low
**Location:** `wizardHelpers.js:82-97` (frontend)

**Description:**
When an admin adds a new race during tournament creation/editing, the race is pre-populated with `raceStartTime: "${tournamentStartDate}T09:00"` and `raceEndTime: "${tournamentStartDate}T10:00"`. For multi-day tournaments, the default date is always the tournament start date, not the current day. Admins may miss updating the date for races on later days, submitting them incorrectly. There is no visual warning if multiple races share the same default time.

**Recommended Fix:**
Default new races to empty strings for `raceStartTime` and `raceEndTime` and make them required fields that must be filled in explicitly, rather than auto-populating with potentially wrong defaults.

---

### L-03 — VenueImageField shares both file and existingSrc as useEffect dependencies, causing unnecessary revocations

**Severity:** Low
**Location:** `VenueImageField.jsx:12-21`

**Description:**
The `useEffect` depends on both `[existingSrc, file]`. If only `existingSrc` changes (e.g., parent re-renders with a new URL string for the same image), the effect runs, finds `file` is null, and replaces `previewSrc` with the new `existingSrc`. The object URL cleanup only runs when `file` is truthy. This is functionally correct, but when `file` changes while `existingSrc` is also a different string, the effect creates a new object URL before revoking the old one (the revoke is the cleanup of the *previous* effect run). The sequence is correct due to React's cleanup guarantee, but it is fragile.

**Recommended Fix:**
Separate the two effects: one for `file` (create/revoke object URL), one for `existingSrc` (set preview if no file is selected).

---

### L-04 — createTemporaryId uses Math.random — not unique enough under high wizard activity

**Severity:** Low
**Location:** `wizardHelpers.js:9-11` (frontend)

**Description:**
`Math.random().toString(36).slice(2, 9)` generates a 7-character base-36 ID (~78 billion combinations). Within a single wizard session with a small number of races and conditions, collisions are extremely unlikely but not impossible. If a collision occurs, two races or conditions share the same key, causing React's reconciler to confuse them and potentially losing form data.

**Recommended Fix:**
Use `crypto.randomUUID()` (available in all modern browsers) for generated IDs.

---

### L-05 — Race order auto-increment findMaximumRaceOrder returns 0 when no races exist — not documented

**Severity:** Low
**Location:** `RaceService.java:115-119`

**Description:**
When `raceOrder` is not provided in `CreateRaceRequest`, the service calls `raceRepository.findMaximumRaceOrder(tournamentId) + 1`. If no races exist yet, `findMaximumRaceOrder()` presumably returns `0` (by convention), giving `raceOrder = 1`. This is the expected behavior, but if the repository method returns `null` (e.g., using `MAX()` aggregate on an empty table returns `NULL` in SQL), the `+ 1` will throw a `NullPointerException`.

**Reproduction:**
Create the first race in a tournament without providing a `raceOrder`, if `findMaximumRaceOrder()` returns `null` on empty result.

**Recommended Fix:**
Ensure the repository method is annotated or implemented to return `0` (not `null`) when no races exist: use `COALESCE(MAX(race_order), 0)` in the JPQL/Native query.

---

## Appendix: Duplicate Code Patterns

The following pattern is repeated verbatim across `TournamentService`, `AdminRegistrationService`, and `RaceEntryService`:

```java
User admin = userRepository.findByEmail(adminEmail)
    .orElseThrow(() -> new ApiException(UNAUTHORIZED, "..."));
if (admin.getRole() == null || !"ADMIN".equalsIgnoreCase(admin.getRole().getRoleName())) {
    throw new ApiException(FORBIDDEN, "...");
}
if (!"ACTIVE".equalsIgnoreCase(admin.getStatus())) {
    throw new ApiException(FORBIDDEN, "...");
}
```

This triplicates the admin validation logic across three service classes. A single `AdminAuthorizationService.requireActiveAdmin(email)` helper would eliminate the duplication and ensure consistent error messages.

Similarly, the `toCandidateResponse()` and `toResponse()` mapping patterns in `RaceEntryService` both query for tournament, horse, owner, and jockey individually — sharing 80% of their logic but implemented separately.
