# Explore Jordan Tourism Platform

Explore Jordan is a responsive tourism web platform for discovering destinations, activities, and accommodation options across Jordan. It presents curated travel content through dynamic cards, search and filtering tools, an interactive map, and a polished travel-focused interface.

The current frontend uses structured JSON files as its data source. A Supabase PostgreSQL schema has been planned as a future database upgrade, but it is not connected to the frontend yet.

## Features

- Responsive layout for desktop, tablet, and mobile screens
- Dynamic tourism cards rendered from JSON data
- Destination search by name, city, category, tags, and descriptions
- Activity search by name, location, category, tags, and descriptions
- Category and city/location filtering
- Favorites feature using `localStorage`
- Loading, empty, and error states for dynamic data
- Interactive map powered by Leaflet.js
- Hero slider, carousel, and experience card interactions
- Explore Jordan branding across pages
- Planning structure for future Supabase PostgreSQL integration

## Technologies Used

- HTML5
- CSS3
- JavaScript
- JSON
- Tailwind CSS utility classes
- Leaflet.js
- Owl Carousel
- Font Awesome
- Supabase PostgreSQL schema planning

## Project Structure

```text
Explore Jordan/
|-- index.html
|-- pages/
|   |-- top.html
|   |-- activity.html
|   `-- attraction.html
|-- css/
|   `-- styles.css
|-- js/
|   `-- script.js
|-- data/
|   |-- destinations.json
|   |-- activities.json
|   |-- accommodations.json
|   `-- data.json
|-- database/
|   |-- supabase-schema.sql
|   `-- seed-data-notes.md
`-- assets/
    `-- images/
```

## Data Structure

The frontend currently reads data from JSON files inside the `data/` folder:

- `destinations.json` stores destination details such as name, city, category, descriptions, image path, map link, official link, and tags.
- `activities.json` stores activity details such as name, location, category, duration, price range, map link, and tags.
- `accommodations.json` stores accommodation types with city, price range, descriptions, booking link, image path, and tags.

These JSON files power the dynamic cards, search, filters, loading states, and favorite buttons.

## Database Plan

Supabase PostgreSQL is planned as the future database layer. The file `database/supabase-schema.sql` includes planned table definitions for:

- `destinations`
- `activities`
- `accommodations`
- `categories`

The frontend has not been connected to Supabase yet. JSON remains the active data source until a future migration.

## Running Locally

Because the project loads JSON files with `fetch()`, run it through a local server instead of opening `index.html` directly from the filesystem.

```bash
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/
```

Main pages:

- `http://127.0.0.1:8000/index.html`
- `http://127.0.0.1:8000/pages/top.html`
- `http://127.0.0.1:8000/pages/activity.html`
- `http://127.0.0.1:8000/pages/attraction.html`

## Future Improvements

- Connect the frontend to Supabase PostgreSQL
- Add a dedicated favorites page
- Add admin-friendly data management
- Improve multilingual content coverage
- Add detailed destination and activity pages
- Add booking or itinerary planning workflows
- Improve image asset management and optimization

## Portfolio Value

This project demonstrates practical frontend development skills, including responsive UI design, dynamic data rendering, reusable JavaScript functions, search and filtering logic, localStorage persistence, error and loading states, and database planning. It also shows an ability to structure a real-world tourism product with maintainable data files and a clear path toward a backend upgrade.
