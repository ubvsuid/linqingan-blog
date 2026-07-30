# Manual accessibility test matrix

Automated checks are a release baseline, not evidence that the site works for every person or assistive technology. Record real manual results in the `Manual accessibility and mobile review` issue form. Never mark an untested combination as passed.

## Status vocabulary

Use one of these values for every route and environment combination:

- **Pass**: every listed check that applies was performed and no blocking issue was found.
- **Fail**: at least one reproducible accessibility problem was found.
- **Blocked**: the review could not be completed because the device, assistive technology, account state, or test data was unavailable.
- **Not applicable**: the check does not apply; explain why.

Record the test date, reviewer, browser and version, operating system, device, assistive technology and version, viewport, zoom, contrast setting, and input method. A result applies only to the recorded environment.

## Minimum route coverage

Prioritize representative interaction patterns instead of claiming that one page proves the whole site.

| Route | What it represents |
| --- | --- |
| `/en` | Global header, navigation, search entry, cards, and footer |
| `/en/beginner` | Learning sequence and progress controls |
| `/en/blog` | Search, filters, sorting, pagination, and result announcements |
| One long `/en/blog/...` guide | Skip link, headings, table of contents, code blocks, feedback, and previous/next navigation |
| `/en/search` | Search field, empty state, result updates, and keyboard flow |
| `/en/tools/creep-body-calculator` | Form labels, calculated status, copy, and share actions |
| `/en/tools/room-diagnostics` | Complex form controls, errors, results, copy, and share actions |
| `/en/evidence` | Status wording, lists, external issue-form links, and machine-readable status link |

Add a route whenever a change introduces a new interaction pattern.

## Minimum environment matrix

Unavailability is recorded as **Blocked**, not silently converted to Pass.

| Platform | Browser | Assistive technology/input | Required checks |
| --- | --- | --- | --- |
| Windows | Firefox or Chrome | NVDA and keyboard | Landmarks, headings, link purpose, forms, status messages, focus order, skip link |
| macOS | Safari | VoiceOver and keyboard | Rotor navigation, labels, dynamic status, focus visibility, reduced motion |
| iPhone | Safari | VoiceOver and touch | Swipe order, touch targets, orientation, zoom, form feedback |
| Android | Chrome | TalkBack and touch | Reading order, touch targets, forms, status announcements, orientation |
| Desktop | Current standards-based browser | Keyboard only | All controls, menus, focus trapping, escape behavior, visible focus |
| Desktop | Current standards-based browser | 200% zoom and 320 CSS px reflow | No lost controls, no two-dimensional scrolling except essential tables/code |
| Windows | Edge | Forced colors or high contrast | Visible controls, focus, selected state, and non-color meaning |

## Test procedure

1. Start at the top of the route with a fresh session.
2. Use the skip link and navigate the full route without a pointer.
3. Confirm focus order follows the visible and semantic reading order.
4. Check that focus never disappears behind sticky UI and is not trapped.
5. With a screen reader, review landmarks and headings before operating forms.
6. Confirm labels, descriptions, errors, and dynamic result messages are announced.
7. Repeat the task at 200% zoom and at 320 CSS pixels.
8. On a real mobile device, repeat with touch exploration and orientation changes.
9. Record each failure with expected result, actual result, severity, and exact steps.
10. After a fix, retest the same environment and record the new result; do not erase the original finding.

## Severity guide

- **Critical**: the core task cannot be completed and no practical workaround exists.
- **Serious**: a major task or important information is unavailable to some users.
- **Moderate**: the task remains possible but requires unnecessary effort or a workaround.
- **Minor**: a localized issue with limited impact.

The issue is complete only when its tested scope, failures, blockers, and retest outcomes are clear. Completion does not imply that untested devices or assistive technologies passed.
