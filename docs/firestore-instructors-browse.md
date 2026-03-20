# Firestore data: instructors on Book Lesson (browse)

The Book Lesson page is built around the **`mountains`** collection. There is no hardcoded resort list: if `mountains` is empty, an admin notice is shown and all instructors still appear without mountain filtering.

## `users` collection (instructors)

Documents appear in browse only if:

| Field | Expected |
|--------|-----------|
| `role` | **Exactly** the string `"instructor"` (lowercase). Other values (`"Instructor"`, missing, etc.) are **not** returned by Firestore `where('role', '==', 'instructor')`. |
| `hourlyRate` / `price` | **Admin–instructor only** (payroll / internal). **Not shown** on Book Lesson; students see **mountain** `privateLessonPrice` / `groupLessonPrice` only. |
| `name` | Used for search; missing name still loads but search is limited. |
| `mountainId` | Optional. Firestore document **id** of a doc in `mountains` (not the display name). |
| `homeMountain` | Optional. Should match `mountains.name` for the resort (compared case-insensitively when a mountain is selected). |
| `preferredLocations` | Optional string array of resort names (case-insensitive match to selected mountain name). |

## `mountains` collection

| Field | Expected |
|--------|-----------|
| `name` | Display name; must align with `homeMountain` / dropdown / `preferredLocations` entries. |
| `instructorIds` | Array of instructor **user document ids**. Updated when assigning in admin; browse treats membership here as belonging to that mountain even if user fields are out of sync. |
| `privateLessonPrice` / `groupLessonPrice` | **Only** source for student-facing rates on Book Lesson (cards, filters, AI matches, booking modal). Default slider max is 500. |

## Common reasons instructors “don’t show”

1. **Resort selected** but the instructor has no `mountainId`, no matching `homeMountain`/`preferredLocations`, and is not in that mountain’s `instructorIds`.
2. **Price filter** max lower than the mountain’s private/group rate (fixed default: 0–500).
3. **Other filters** (discipline, level, gender, language, certification) excluding them.
4. **`role`** not exactly `"instructor"` in Firestore.

## `instructorStats` collection

Optional. Missing docs use placeholder stats; instructors still appear.
