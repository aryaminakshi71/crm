# Jira CSV Import Mapping Guide (Nucleo One)

## Source File
- `docs/planning/nucleo-one-30-day-backlog.csv`

## Recommended Jira Setup
- Project type: company-managed software project
- Issue type for rows: `Task` (or `Story` if your team prefers)
- Optional custom fields to create before import:
  - `Ticket ID` (single line text)
  - `Dependencies` (single line text)
  - `Acceptance Criteria` (paragraph text)

## Field Mapping (CSV -> Jira)
- `Epic` -> `Epic Name` (if importing epics) or `Labels`/`Component/s` (if importing only tasks)
- `Ticket` -> `Ticket ID` (custom field) or include in `Description`
- `Owner` -> `Assignee` (only works when CSV values match Jira users)
- `Priority` -> `Priority`
- `Estimate` -> `Original estimate`
- `Dependencies` -> `Dependencies` (custom field) or `Description`
- `Acceptance Criteria` -> `Acceptance Criteria` (custom field) or append to `Description`

## Practical Import Strategy
1. Import all rows as `Task` first.
2. Map `Epic` to `Labels` initially for guaranteed compatibility.
3. Keep `Ticket` in a custom `Ticket ID` field for traceability.
4. If `Assignee` values do not match Jira users, skip assignee in import and bulk-assign later.
5. After import, create real epics and bulk-link tasks by `Epic` label.
6. Convert `Dependencies` text into issue links (`blocks`/`is blocked by`) manually or with automation.

## Jira Import Steps
1. Jira -> `Settings` -> `System` -> `External system import` -> `CSV`.
2. Upload `docs/planning/nucleo-one-30-day-backlog.csv`.
3. Choose project and default issue type.
4. Map fields using the table above.
5. Run a small test import (3-5 rows) before full import.
6. Run full import and verify:
   - priorities set correctly
   - estimates parsed
   - acceptance criteria populated
   - labels/components for epics are consistent

## Notes
- CSV imports do not reliably create dependency links directly from custom text values; treat dependencies as a second pass.
- If you want true epic hierarchy in one shot, import epics first, then re-import tasks with `Epic Link` values matching created epic keys.
