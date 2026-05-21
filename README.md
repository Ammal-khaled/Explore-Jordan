# Explore Jordan

Explore Jordan is a tourism web platform designed to help users discover destinations, accommodations, and activities across Jordan. The platform offers multilingual support, destination cards, travel tips, and an interactive map.

## Features

- Explore top destinations (e.g., Petra, Wadi Rum)
- Travel tips and cultural insights
- Multilingual support (e.g., English, Arabic)
- Interactive map with major attractions
- Responsive design using Bootstrap
- Travel experiences and accommodation highlights

## Technologies

- HTML, CSS, Bootstrap
- JavaScript
- Leaflet.js for maps
- JSON (current data structure)
- Planned: Supabase PostgreSQL for destinations, accommodations, activities, and categories

## Database Plan

Supabase PostgreSQL is planned for a future data layer. The current frontend still uses the JSON files in `data/`, and no Supabase connection has been added yet.

Database planning files have been added in `database/`:

- `supabase-schema.sql` contains the planned table definitions.
- `seed-data-notes.md` documents how the current JSON fields can map to database columns later.
