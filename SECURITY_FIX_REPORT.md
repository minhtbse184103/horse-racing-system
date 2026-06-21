# Security Fix Report

**Date:** 2026-06-21
**Branch:** feature/admin-event-complete-huy
**Fixes:** C-01, C-02, C-03, C-04 (Critical authorization), H-01 (Business integrity)

---

## Test Results

```
Tests run: 55, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS — Total time: 9.211 s
```

---

## Files Changed

### Backend — Source

| File | Change |
|------|--------|
| `backend/src/main/java/com/example/backend/controller/TournamentController.java` | Added `Authentication` param to `updateTournament` and `cancelTournament` |
| `backend/src/main/java/com/example/backend/controller/RaceController.java` | Added `Authentication` import and param to `createRace`, `updateRace`, `closeRegistration`, `completeRace`, `cancelRace` |
| `backend/src/main/java/com/example/backend/controller/AdminRegistrationController.java` | Added `Authentication` param to `updatePaymentStatus` |
| `backend/src/main/java/com/example/backend/controller/AdminRefereeAssignmentController.java` | Added `Authentication` import and param to `createAssignment`, `replaceAssignment`, `removeAssignment` |
| `backend/src/main/java/com/example/backend/service/TournamentService.java` | Added `adminEmail` param + `getAdmin()` call to `updateTournament` and `cancelTournament`; added ACTIVE status check to existing `getAdmin()`; H-01: bulk-cancel ASSIGNED RaceEntry records on tournament cancellation |
| `backend/src/main/java/com/example/backend/service/RaceService.java` | Added `UserRepository` dependency; added `adminEmail` param + `getAdmin()` call to all five mutation methods; added `getAdmin()` private helper |
| `backend/src/main/java/com/example/backend/service/AdminRegistrationService.java` | Added `adminEmail` param + `getAdmin()` call to `updatePaymentStatus` |
| `backend/src/main/java/com/example/backend/service/RefereeAssignmentService.java` | Added `adminEmail` param + `getAdmin()` call to `createAssignment`, `replaceAssignment`, `removeAssignment`; added `getAdmin()` private helper |
| `backend/src/main/java/com/example/backend/repository/RaceEntryRepository.java` | Added `findByRaceIdInAndStatus(List<Integer>, String)` for bulk entry lookup on cancel |

### Backend — Tests

| File | Change |
|------|--------|
| `backend/src/test/java/com/example/backend/service/TournamentServiceTest.java` | Updated `updateTournament` and `cancelTournament` calls to pass `adminEmail`; added `assertNotNull` import; added 5 new tests |
| `backend/src/test/java/com/example/backend/service/RaceServiceTest.java` | Added `UserRepository` mock and `UserRepository` import; added `Role`, `User`, `HttpStatus` imports; added `activeAdmin()` and `stubAdmin()` helpers; updated `updateRace` calls to pass `adminEmail`; added 3 new security tests |
| `backend/src/test/java/com/example/backend/service/AdminRegistrationServiceTest.java` | Updated `updatePaymentStatus` calls to pass `adminEmail`; added admin stubs to affected tests; added 2 new security tests |
| `backend/src/test/java/com/example/backend/service/RefereeAssignmentServiceTest.java` | Added `HttpStatus` import; added `activeAdmin()` and `stubAdmin()` helpers; updated `createAssignment`, `replaceAssignment`, `removeAssignment` calls to pass `adminEmail`; added 3 new security tests |

---

## Security Fixes

### C-01 — Tournament update and cancel now require ADMIN role

**Before:** `PUT /api/tournaments/{id}` and `DELETE /api/tournaments/{id}` accepted no `Authentication`. `TournamentService.updateTournament()` had no role check.

**After:** Both endpoints extract `authentication.getName()` and pass it to the service. The service calls `getAdmin(adminEmail)` which verifies role = ADMIN and status = ACTIVE, throwing `403 FORBIDDEN` otherwise. The existing `getAdmin()` helper was also updated to enforce the ACTIVE status check (it previously only checked role).

### C-02 — Race mutations now require ADMIN role

**Before:** `POST /api/races`, `PUT /api/races/{id}`, `PUT /api/races/{id}/close-registration`, `PUT /api/races/{id}/complete`, `DELETE /api/races/{id}` had no `Authentication` parameter and `RaceService` performed no role check.

**After:** All five endpoints extract `authentication.getName()`. `RaceService` now depends on `UserRepository` and calls `getAdmin(adminEmail)` as the first action in each mutating method, throwing `401 UNAUTHORIZED` if the email is unknown or `403 FORBIDDEN` if the user is not an active ADMIN.

### C-03 — Payment status update now requires ADMIN role

**Before:** `PUT /api/admin/registrations/{id}/payment-status` accepted no `Authentication`. Any authenticated user could set a registration's payment status to PAID, bypassing the entry fee requirement.

**After:** The endpoint extracts `authentication.getName()` and passes it to `AdminRegistrationService.updatePaymentStatus()`, which now calls `getAdmin(adminEmail)` before loading the registration.

### C-04 — Referee assignment mutations now require ADMIN role

**Before:** `POST /api/admin/referee-assignments`, `PUT /api/admin/referee-assignments/{raceId}/referee/{refereeUserId}`, `DELETE /api/admin/referee-assignments/{raceId}` had no `Authentication`. `RefereeAssignmentService` performed no admin check.

**After:** All three endpoints extract `authentication.getName()`. `RefereeAssignmentService` now has a private `getAdmin(adminEmail)` helper consistent with the pattern in other services. Admin role and active status are verified before any business logic executes.

### H-01 — Tournament cancellation now cancels ASSIGNED RaceEntry records

**Before:** `TournamentService.cancelTournament()` set races to `CANCELLED` but left all `RaceEntry` rows in `ASSIGNED` status. These orphaned entries blocked registrations from appearing in the assignment queue.

**After:** After persisting the cancelled races, the service collects their IDs, queries `raceEntryRepository.findByRaceIdInAndStatus(raceIds, ASSIGNED)`, sets each entry's status to `CANCELLED`, records `cancelledAt` and `cancellationReason = "Tournament cancelled."`, and saves them in a single batch. If no races exist, the entry-update step is skipped entirely.

---

## New Tests Added (13)

### TournamentServiceTest (5 new)
| Test | Verifies |
|------|----------|
| `updateTournamentRejectsNonAdmin` | OWNER role → 403 on update |
| `updateTournamentRejectsInactiveAdmin` | INACTIVE ADMIN → 403 on update |
| `cancelTournamentRejectsNonAdmin` | OWNER role → 403 on cancel |
| `cancelTournamentCancelsAssignedRaceEntries` | Races cancelled → ASSIGNED entries are also cancelled with timestamp and reason |
| `cancelTournamentWithNoRacesSkipsEntryUpdate` | Tournament with no races → `findByRaceIdInAndStatus` never called |

### RaceServiceTest (3 new)
| Test | Verifies |
|------|----------|
| `updateRaceRejectsNonAdmin` | OWNER role → 403 on race update |
| `closeRegistrationRejectsNonAdmin` | JOCKEY role → 403 on close-registration |
| `cancelRaceRejectsInactiveAdmin` | SUSPENDED ADMIN → 403 on cancel |

### AdminRegistrationServiceTest (2 new)
| Test | Verifies |
|------|----------|
| `updatePaymentStatusRejectsNonAdmin` | OWNER role → 403, registration never loaded |
| `updatePaymentStatusRejectsInactiveAdmin` | INACTIVE ADMIN → 403, registration never loaded |

### RefereeAssignmentServiceTest (3 new)
| Test | Verifies |
|------|----------|
| `createAssignmentRejectsNonAdmin` | OWNER role → 403, race never loaded |
| `replaceAssignmentRejectsNonAdmin` | JOCKEY role → 403, race never loaded |
| `removeAssignmentRejectsInactiveAdmin` | INACTIVE ADMIN → 403, assignment never deleted |
