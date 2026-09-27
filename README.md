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
- Trip Advisor suggestions matched against the selected budget and interests
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
|   |-- hotels.html
|   |-- attraction.html
|   `-- advisor.html
|-- css/
|   |-- styles.css
|   `-- advisor.css
|-- js/
|   |-- script.js
|   `-- advisor.js
|-- data/
|   |-- destinations.json
|   |-- activities.json
|   |-- accommodations.json
|   `-- data.json
|-- database/
|   |-- supabase-schema.sql
|   |-- seed.sql
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

## AI Trip Advisor Setup

The Trip Advisor can use Gemini through the `trip-advisor-chat` Supabase Edge Function. If Supabase is not configured locally, the widget falls back to its rule-based suggestions. The browser uses only the project's public Supabase URL and anon key; keep the Gemini API key in Edge Function secrets.

Copy `js/supabase-config.example.js` to the ignored local file `js/supabase-config.js`, then replace its URL and anon-key placeholders with values from your Supabase project. `.gitignore` excludes `js/supabase-config.js` so project credentials are not committed.

From the project root, authenticate and link the Supabase CLI, set the Gemini key as a project secret, and deploy the function:

```bash
supabase login
supabase projects list
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
supabase functions deploy trip-advisor-chat
```

The Gemini key is never stored in this repository. The function currently targets Gemini 3.8 Flash; check the provider's model availability and pricing before launch.

## Search Engine Files and Structured Data

`robots.txt` and `sitemap.xml` currently assume the site will be published at `https://ammal-khaled.github.io/Explore-Jordan/`. Replace that base URL in both files before launch if the production domain is different. Attraction detail pages emit `TouristAttraction` JSON-LD from destination data, and the accommodation listing emits `LodgingBusiness` entries in an `ItemList`. Accommodation entries are currently generic categories rather than verified individual properties; replace them with real business records before using them as commercial listings.

## Current Product Scope

This is a travel-discovery frontend backed by local JSON files. When configured, Trip Advisor sends the conversation and budget-filtered listings through the Supabase Edge Function to Gemini; if the service is not configured or unavailable, it uses local rule-based suggestions. Favorites and saved trip ideas live in the visitor's browser, and the site does not accept booking requests or payments. Maps, fonts, and some interface libraries load from third-party CDNs. Before offering it as a live commercial service, connect a booking or inquiry workflow, add the business's real contact and policy pages, verify travel information and image rights, and choose production hosting.

## Running Locally

Because the project loads JSON files with `fetch()`, run it through a local server instead of opening `index.html` directly from the filesystem.

```bash
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/
```

## Developer Checks

Install the development tools with `npm install`, then run `npm test`, `npm run lint`, or `npm run format:check`. The tests use Node's built-in test runner. The project supports Node.js `^20.19.0`, `^22.13.0`, or `>=24` to match ESLint 10's runtime requirements. `npm run format` applies the configured Prettier formatting to `js/*.js` and `tests/*.cjs`; the pre-existing, explicitly excluded Supabase service file stays unchanged.

Main pages:

- `http://127.0.0.1:8000/index.html`
- `http://127.0.0.1:8000/pages/top.html`
- `http://127.0.0.1:8000/pages/activity.html`
- `http://127.0.0.1:8000/pages/hotels.html`
- `http://127.0.0.1:8000/pages/attraction.html`
- `http://127.0.0.1:8000/pages/advisor.html`

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
