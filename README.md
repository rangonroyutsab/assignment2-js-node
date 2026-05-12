# Sanctuary Cap Cana Resort Landing Page

A responsive single-page resort booking landing page for **Sanctuary Cap Cana**, built with plain HTML, CSS, vanilla JavaScript, and a lightweight Node.js local server.

The project includes a luxury resort detail page with a hero gallery, booking card, date picker, expandable content sections, nearby resort cards, sorting, favourites, image gallery modal, and Google Maps integration.

## Try It! 
[https://rangonroyutsab.github.io/assignment2-js-node/](https://rangonroyutsab.github.io/assignment2-js-node/)
> Map won't work unless you use a valid API key.

## Features

- Responsive desktop, tablet, and mobile layouts
- Sticky site header with mobile-specific navigation layout
- Hero image gallery with a **View all images** modal
- Desktop gallery grid with fixed page background while the modal is open
- Mobile gallery slider with next/previous arrows, swipe support, and image counter
- Expandable About, Amenities, and Review content
- Booking card with Hotel Datepicker integration
- Automatic price calculation based on selected nights
- Nearby resorts section powered by local JSON data
- Nearby resort sorting by:
  - Most popular
  - Highest price
  - Lowest price
- Skeleton loading state for nearby cards
- Empty/error UI handling for API data
- Favourite buttons saved in `localStorage`
- Google Maps sidebar with selectable custom markers
- Map badge/card selection highlighting
- Local `/images` endpoint for gallery images
- Local `/map-config` endpoint for Google Maps API key loading

## Tech Stack

- **HTML5**
- **CSS3**
  - CSS custom properties
  - Grid and Flexbox layouts
  - Responsive media queries
- **Vanilla JavaScript**
  - DOM updates
  - Fetch API
  - Local storage
  - Date calculations
  - Modal controls
  - Google Maps marker handling
- **Node.js HTTP server**
  - Static file serving
  - Local JSON API routes
  - Image listing endpoint
  - Environment variable loading

## Third-Party Libraries / CDNs

The page uses these external libraries in `index.html`:

- Font Awesome
- Google Fonts
  - Marcellus
  - Open Sans
- Hotel Datepicker
- Fecha
- Google Maps JavaScript API, loaded dynamically from the local `/map-config` endpoint

## Project Structure

```text
.
├── index.html
├── styles.css
├── script.js
├── server.js
├── package.json
├── package-lock.json
├── README.md
├── assets/
│   ├── fonts/
│   └── icons/
├── data/
│   ├── highest_price.json
│   ├── lowest_price.json
│   └── most_popular.json
└── images/
```

## Main Files

### `index.html`

Contains the full page markup, including:

- Header
- Breadcrumbs
- Resort title and rating details
- Hero gallery
- Page navigation
- About section
- Resort highlights
- Amenities
- Contact banners
- Activities
- Reviews
- Policies
- FAQs
- Location section
- Booking sidebar
- Nearby resorts section
- Footer
- Gallery modal
- CDN script/style links

### `styles.css`

Contains all visual styling and responsive behavior, including:

- Global variables and design tokens
- Base reset styles
- Header styles
- Hero gallery styles
- Content cards
- Booking card
- Nearby cards and map sidebar
- Footer styles
- Gallery modal styles
- Tablet and mobile media queries placed near their related sections

### `script.js`

Handles all browser-side interactivity, including:

- Nearby resort rendering
- Nearby resort sorting
- Skeleton card loading
- Favourite toggling with local storage
- Booking date picker setup
- Price calculation
- Gallery modal fetching and controls
- Expandable content sections
- Google Maps loading
- Custom map markers
- Nearby card/map selection syncing

### `server.js`

Runs the local HTTP server and provides:

- Static file serving
- `.env` loading
- `/get-property` API route
- `/images` API route
- `/map-config` API route
- Basic MIME type handling
- Basic path safety checks

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Add environment variables

Create a `.env` file in the project root if you want Google Maps to load:

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

The page will still run without this key, but the Google Maps sidebar will not load live map data.

### 3. Start the local server

```bash
npm start
```

### 4. Open the site

Visit:

```text
http://localhost:3000
```

## Available NPM Scripts

```bash
npm start
```

Starts the Node.js local server using `server.js`.

```bash
npm test
```

Currently only contains the default placeholder test command.

## Local API Routes

### `GET /get-property`

Returns nearby resort data from the local JSON files.

Supported query parameters:

```text
/get-property?most-popular=true&limit=6
/get-property?highest-price=true&limit=6
/get-property?lowest-price=true&limit=6
```

If no recognized sort parameter is provided, the server defaults to `most_popular.json`.

### `GET /images`

Returns up to 10 image paths from the local `images/` folder.

Supported image formats:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.svg`

The gallery modal uses this endpoint to display property images.

### `GET /map-config`

Returns the Google Maps API key from the local environment:

```json
{
  "googleMapsApiKey": "your_key_here"
}
```

The frontend uses this route to dynamically load the Google Maps JavaScript API without hardcoding the key in `script.js`.

## Data Files

The nearby resorts section reads from these files inside the `data/` folder:

```text
data/most_popular.json
data/highest_price.json
data/lowest_price.json
```

Each file may either be a direct array of property items or an object with this structure:

```json
{
  "Result": {
    "Items": []
  }
}
```

The server normalizes both formats before returning data to the frontend.

## Image Gallery

The gallery modal opens when the user clicks **View all images**.

Desktop behavior:

- Modal appears above the page
- Background page is locked and does not scroll
- Images are displayed in a scrollable gallery grid
- Clicking outside the dialog closes the modal

Mobile behavior:

- Modal becomes a full-screen image slider
- Supports horizontal touch swiping
- Includes next and previous arrow buttons
- Displays an image counter
- Supports closing with the close button or outside/overlay target where applicable

## Google Maps Setup

To enable the nearby map sidebar:

1. Create a `.env` file in the project root.
2. Add your Google Maps key:

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

The frontend requests this through `/map-config` and then loads the Google Maps script dynamically.

Nearby property markers are generated from each item's `GeoInfo.Lat` and `GeoInfo.Lng` values.

## Browser Storage

The nearby resort favourite buttons use `localStorage`.

Storage key:

```text
capCanaFavouriteProperties
```

Saved favourite IDs persist across page reloads in the same browser.

## Responsive Notes

The layout includes custom breakpoints for:

- Desktop/base layout
- Tablet: `max-width: 1024px`
- Mobile: `max-width: 768px`

On mobile:

- The page background becomes white
- The hero gallery becomes a single full-width image
- The page navigation is hidden
- The booking card stacks vertically
- Nearby cards become a single-column list
- The nearby map sidebar is hidden
- Activity/highlight sections use horizontal scrolling where appropriate
- The gallery modal becomes a full-screen slider

## Requirements

- Node.js 18 or newer is recommended
- npm
- A modern browser
- Google Maps API key if live map rendering is required

## Notes

- The project is intentionally built without a frontend framework.
- Most external UI assets are loaded through CDNs.
- Local JSON data powers the nearby resort cards.
- Local images from the `images/` folder power the gallery modal.
- The server is intended for local development/demo usage, not production deployment as-is.