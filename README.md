# Sanctuary Cap Cana Resort Landing Page

## Project Overview
A single-page, responsive resort booking landing page for Sanctuary Cap Cana. The page showcases a photo gallery, resort highlights, amenities, activities, reviews, policies, FAQs, a booking widget with date selection and price calculation, and a nearby resorts section powered by local JSON data.

## Tech Stack
- HTML5
- CSS3 (custom layout, responsive styles, design tokens)
- Vanilla JavaScript (DOM updates, date logic, local storage)
- Node.js (simple HTTP server and JSON API)
- Third-party libraries and CDNs
  - Font Awesome icons
  - Google Fonts (Marcellus, Open Sans)
  - Hotel Datepicker
  - Fecha (date formatting)

## Project Structure
```
.
├── index.html
├── styles.css
├── script.js
├── server.js
├── package.json
├── package-lock.json
├── assets/
│   ├── fonts/
│   └── icons/
├── data/
│   ├── highest_price.json
│   ├── lowest_price.json
│   └── most_popular.json
└── images/
```

## How to Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local server:
   ```bash
   npm start
   ```
3. Open the app in your browser:
   - http://localhost:3000

> The local server serves static files and exposes `/get-property` and `/images` endpoints used by the Nearby Resorts section.

## Features
- Fully responsive, modern single-page layout
- Sticky header and in-page navigation
- Hero gallery with featured and grid images
- Expandable sections (About and Reviews)
- Booking widget with date range picker and price calculation
- Nearby resorts grid with sorting (most popular, highest price, lowest price)
- Skeleton loading state and empty/error handling for API data
- Favorites saved in local storage
- Integrated map embed and rich content sections
