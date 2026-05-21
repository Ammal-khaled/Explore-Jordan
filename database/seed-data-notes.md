# Seed Data Notes

The frontend currently uses JSON files in `data/` as the source of truth:

- `data/destinations.json`
- `data/activities.json`
- `data/accommodations.json`

When Supabase is connected later, these JSON files can be transformed into SQL seed inserts for the matching PostgreSQL tables in `database/supabase-schema.sql`.

## Mapping Notes

- JSON `shortDescription` maps to SQL `short_description`.
- JSON `longDescription` maps to SQL `long_description`.
- JSON `mapLink` maps to SQL `map_link`.
- JSON `officialLink` maps to SQL `official_link`.
- JSON `priceRange` maps to SQL `price_range`.
- JSON `bookingLink` maps to SQL `booking_link`.
- JSON `tags` maps to PostgreSQL `text[]`.

Keep the JSON files in place until the frontend is intentionally migrated to Supabase.
