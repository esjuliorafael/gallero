# Project Guidelines: Gallero

## Spacing Guide (Semantic Scale)
Adhere strictly to this base-4 spacing scale for all present and future development in the Gallero project:

*   **`mt-2` (8px) — tight**: Intimately related elements. Examples: title → description, input → error message, button → secondary link.
*   **`mt-4` (16px) — group**: Elements of the same functional group. Example: input → button inside a form.
*   **`mt-6` (24px) — section**: Section change. Example: text block → form.
*   **`mt-8` (32px) — block**: Completely independent blocks. Used for screens with multiple cards or sections.

### Application Rules:
1.  **Semantic Choice**: Before assigning an `mt-*` class, ask yourself if the two elements belong to the same thought (tight), the same functional group (group), mark a section change (section), or are independent blocks (block).
2.  **AuthLayout Container**: NEVER use `gap-*` in the container of `AuthLayout`. Spacing between elements must be controlled exclusively with `mt-*` on each individual page to maintain semantic control by context.
3.  **No Arbitrary Values**: NEVER introduce arbitrary values like `mt-3`, `mt-5`, `mt-7`, or arbitrary `px` values for vertical spacing between content elements. If you feel you need an intermediate value, check if the issue is actually spacing or typography size.
4.  **Base Pattern for New Screens**: When creating a new screen, always follow this base pattern:
    *   `[Title]` (no mt)
    *   `[Description]` (with `mt-2`)
    *   `[Form]` (with `mt-6`)
    *   `[First form element]` (no mt)
    *   `[Subsequent elements]` (with `mt-4`)
    *   `[Subordinate elements]` (with `mt-2`)
