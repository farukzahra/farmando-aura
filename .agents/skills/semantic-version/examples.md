# Examples

## New feature (minor bump)

`currentVersion`: `0.14.2` → `0.15.0`

```json
{
  "version": "0.15.0",
  "date": "2026-07-07",
  "title": "Vuetify UI migration",
  "summary": "Replaced PrimeVue with Vuetify 3 and a blue-orange theme while keeping tables, filters, and modals.",
  "type": "feat",
  "commit": "9f3a1bc"
}
```

## Bugfix (patch bump)

`currentVersion`: `0.15.0` → `0.15.1`

```json
{
  "version": "0.15.1",
  "date": "2026-07-08",
  "title": "Transactions table without pagination",
  "summary": "The main transactions table now shows every row for the filtered period at once.",
  "type": "fix",
  "commit": "c4e8120"
}
```

## Internal refactor — no entry

Changed service layer structure, no API or UI change → **do not** edit `docs/release-history.json`.

## Breaking change (major bump)

`currentVersion`: `0.15.6` → `1.0.0`

```json
{
  "version": "1.0.0",
  "date": "2026-07-10",
  "title": "Category IDs are now UUIDs",
  "summary": "Categories use stable UUID ids. Run the migration before deploying; CSV import mapping was updated.",
  "type": "breaking",
  "commit": "d71af02"
}
```
