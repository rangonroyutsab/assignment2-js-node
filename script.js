/* =========================================================
   DOM REFERENCES
========================================================= */

const nearbyGrid = document.getElementById("nearbyGrid");
const nearbySort = document.getElementById("nearbySort");

const bookingDateInput = document.getElementById("bookingDateRange");
const checkInField = document.getElementById("checkInField");
const checkOutField = document.getElementById("checkOutField");
const pricePerNightEl = document.getElementById("pricePerNight");
const totalPriceEl = document.getElementById("totalPrice");

const openGalleryBtn = document.getElementById("openGalleryBtn");
const galleryModal = document.getElementById("galleryModal");
const galleryTrack = document.getElementById("galleryTrack");
const galleryCounter = document.getElementById("galleryCounter");
const galleryPrevBtn = document.getElementById("galleryPrevBtn");
const galleryNextBtn = document.getElementById("galleryNextBtn");


/* =========================================================
   CONFIG
========================================================= */

const FAVOURITES_STORAGE_KEY = "capCanaFavouriteProperties";
const FEATURE_IMAGE_PREFIX = "https://beta.imgservice.rentbyowner.com/640x300/";
const PRICE_PER_NIGHT = 2026;
const SITE_ACCENT_COLOR = "#ef7c00";

const DEFAULT_MAP_CENTER = {
    lat: 39.8283,
    lng: -98.5795
};

const sortApiMap = {
    "most-popular": "most-popular=true",
    "highest-price": "highest-price=true",
    "lowest-price": "lowest-price=true"
};


/* =========================================================
   STATE
========================================================= */

let nearbyMap = null;
let nearbyMarkers = [];
let currentNearbyProperties = [];
let selectedPropertyId = null;

let galleryImages = [];
let activeGalleryIndex = 0;


/* =========================================================
   GENERAL UTILITIES
========================================================= */

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getPlatformLimit() {
    return window.matchMedia("(max-width: 768px)").matches ? 4 : 6;
}

function getApiUrl(sortValue = "most-popular") {
    const sortQuery = sortApiMap[sortValue] || sortApiMap["most-popular"];
    const limit = getPlatformLimit();

    return `/get-property?${sortQuery}&limit=${limit}`;
}

function createSkeletonCards(count = getPlatformLimit()) {
    return Array.from(
        { length: count },
        () => `
            <div class="nearby-card nearby-card--skeleton">
                <div class="skeleton skeleton-image"></div>

                <div class="nearby-card__content">
                    <div class="skeleton skeleton-line skeleton-line--short"></div>
                    <div class="skeleton skeleton-line skeleton-line--title"></div>
                    <div class="skeleton skeleton-line"></div>
                    <div class="skeleton skeleton-line skeleton-line--small"></div>

                    <div class="skeleton skeleton-footer">
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `
    ).join("");
}


/* =========================================================
   PROPERTY DATA HELPERS
========================================================= */

function getPropertyId(item, index) {
    return item?.ID || item?.Property?.PropertySlug || `property-${index}`;
}

function getPropertyPosition(item) {
    const lat = Number(item?.GeoInfo?.Lat);
    const lng = Number(item?.GeoInfo?.Lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
    }

    return { lat, lng };
}

function formatPrice(price) {
    const number = Number(price);

    if (!Number.isFinite(number)) {
        return "Price unavailable";
    }

    return `From $${Math.round(number).toLocaleString()}`;
}

function getAmenities(property) {
    const amenities = property?.TopAmenities;

    if (!Array.isArray(amenities) || amenities.length === 0) {
        return "Amenities unavailable";
    }

    return amenities
        .slice(0, 3)
        .map((amenity) => amenity.Name)
        .join(" · ");
}

function getLocation(item) {
    return item?.GeoInfo?.Display || item?.GeoInfo?.City || "Location unavailable";
}

function getImage(item, index) {
    const featureImage = item?.Property?.FeatureImage;

    if (featureImage) {
        return `${FEATURE_IMAGE_PREFIX}${featureImage}`;
    }

    const imageNumber = (index % 10) + 1;
    return `/images/image${imageNumber}.png`;
}

function getProviderLogo(providerUrl = "") {
    const url = providerUrl.toLowerCase();

    if (url.includes("booking.com")) {
        return "https://upload.wikimedia.org/wikipedia/commons/b/be/Booking.com_logo.svg";
    }

    if (url.includes("expedia")) {
        return "https://upload.wikimedia.org/wikipedia/commons/5/5b/Expedia_2012_logo.svg";
    }

    return "https://upload.wikimedia.org/wikipedia/commons/5/51/Vrbo.svg";
}


/* =========================================================
   FAVOURITES
========================================================= */

function getFavouriteProperties() {
    try {
        const savedFavourites = localStorage.getItem(FAVOURITES_STORAGE_KEY);
        const favourites = savedFavourites ? JSON.parse(savedFavourites) : [];

        return Array.isArray(favourites) ? favourites : [];
    } catch (error) {
        console.error("Could not read favourites from local storage:", error);
        return [];
    }
}

function saveFavouriteProperties(favourites) {
    localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(favourites));
}

function isPropertyFavourite(propertyId) {
    const favourites = getFavouriteProperties();

    return favourites.includes(String(propertyId));
}

function addFavouriteProperty(propertyId) {
    const favourites = getFavouriteProperties();
    const id = String(propertyId);

    if (!favourites.includes(id)) {
        favourites.push(id);
        saveFavouriteProperties(favourites);
    }
}

function removeFavouriteProperty(propertyId) {
    const id = String(propertyId);
    const favourites = getFavouriteProperties().filter(
        (favouriteId) => favouriteId !== id
    );

    saveFavouriteProperties(favourites);
}

function toggleFavouriteProperty(propertyId) {
    if (isPropertyFavourite(propertyId)) {
        removeFavouriteProperty(propertyId);
        return false;
    }

    addFavouriteProperty(propertyId);
    return true;
}

function updateFavouriteButton(button, isFavourite) {
    const icon = button.querySelector("i");

    button.classList.toggle("is-active", isFavourite);
    button.setAttribute("aria-pressed", isFavourite ? "true" : "false");
    button.setAttribute(
        "aria-label",
        isFavourite ? "Remove from favourites" : "Add to favourites"
    );

    if (icon) {
        icon.className = `${isFavourite ? "fa-solid" : "fa-regular"} fa-heart`;
    }
}

function handleFavouriteClick(event) {
    const button = event.target.closest("[data-favourite-button]");

    if (!button) return;

    const propertyId = button.dataset.propertyId;

    if (!propertyId) return;

    const isFavourite = toggleFavouriteProperty(propertyId);

    updateFavouriteButton(button, isFavourite);
}


/* =========================================================
   NEARBY PROPERTY CARDS
========================================================= */

function createNearbyCard(item, index) {
    const property = item?.Property || {};
    const partner = item?.Partner || {};
    const counts = property?.Counts || {};

    const propertyId = getPropertyId(item, index);
    const isFavourite = isPropertyFavourite(propertyId);

    const name = property.PropertyName || "Hotel Name Goes Here";
    const price = formatPrice(property.Price || property.CachePrice);
    const location = getLocation(item);
    const amenities = getAmenities(property);
    const propertyType = property.PropertyType || "Villa";
    const reviewScore = property.ReviewScore || property.StarRating || "5.0";
    const reviews = counts.Reviews || 3;
    const image = getImage(item, index);
    const providerLogo = getProviderLogo(partner.URL);
    const partnerUrl = partner.URL || "#";

    return `
        <div class="nearby-card" data-property-id="${escapeHtml(propertyId)}">
            <div class="nearby-card__img-wrapper">
                <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(name)}"
                    class="nearby-card__img"
                    loading="lazy"
                >

                <div class="nearby-card__price">
                    ${escapeHtml(price)}
                </div>

                <div class="nearby-card__badges">
                    <button type="button" class="nearby-card__btn-icon" aria-label="Comment">
                        <i class="fa-solid fa-comment"></i>
                    </button>

                    <button
                        type="button"
                        class="nearby-card__btn-icon nearby-card__btn-icon--map ${selectedPropertyId === String(propertyId) ? "is-active" : ""}"
                        aria-label="Show on map"
                        data-map-button
                        data-property-id="${escapeHtml(propertyId)}"
                    >
                        <i class="fa-solid fa-location-dot"></i>
                    </button>

                    <button
                        type="button"
                        class="nearby-card__btn-icon nearby-card__btn-icon--favorite ${isFavourite ? "is-active" : ""}"
                        aria-label="${isFavourite ? "Remove from favourites" : "Add to favourites"}"
                        aria-pressed="${isFavourite ? "true" : "false"}"
                        data-favourite-button
                        data-property-id="${escapeHtml(propertyId)}"
                    >
                        <i class="${isFavourite ? "fa-solid" : "fa-regular"} fa-heart"></i>
                    </button>
                </div>
            </div>

            <div class="nearby-card__content">
                <div class="nearby-card__content-body">
                    <div class="nearby-card__meta">
                        <span class="nearby-card__rating">
                            <i class="fa-solid fa-star"></i>
                            ${escapeHtml(reviewScore)} (${escapeHtml(reviews)} Reviews)
                        </span>

                        <span class="nearby-card__type">
                            ${escapeHtml(propertyType)}
                        </span>
                    </div>

                    <h3 class="nearby-card__title">
                        ${escapeHtml(name)}
                    </h3>

                    <p class="nearby-card__features">
                        ${escapeHtml(amenities)}
                    </p>

                    <p class="nearby-card__location">
                        ${escapeHtml(location)}
                    </p>
                </div>

                <div class="nearby-card__footer">
                    <img
                        src="${escapeHtml(providerLogo)}"
                        alt="Provider logo"
                        class="nearby-card__provider"
                        loading="lazy"
                    >

                    <a
                        href="${escapeHtml(partnerUrl)}"
                        target="_blank"
                        rel="noopener"
                        class="btn btn--primary btn--small"
                    >
                        View Availability
                    </a>
                </div>
            </div>
        </div>
    `;
}

async function loadNearbyCards(sortValue = "most-popular") {
    if (!nearbyGrid) return;

    nearbyGrid.innerHTML = createSkeletonCards();

    try {
        const response = await fetch(getApiUrl(sortValue));

        if (!response.ok) {
            throw new Error("Could not fetch nearby properties");
        }

        const properties = await response.json();

        if (!Array.isArray(properties) || properties.length === 0) {
            nearbyGrid.innerHTML = `
                <p class="nearby-loading">
                    No nearby properties found.
                </p>
            `;
            return;
        }

        currentNearbyProperties = properties;
        selectedPropertyId = null;

        nearbyGrid.innerHTML = properties
            .map((item, index) => createNearbyCard(item, index))
            .join("");

        renderNearbyMarkers(properties);
    } catch (error) {
        nearbyGrid.innerHTML = `
            <p class="nearby-loading">
                Could not load nearby resorts. Please try again later.
            </p>
        `;

        console.error(error);
    }
}

function handleNearbyCardSelection(event) {
    const card = event.target.closest(".nearby-card");

    if (!card || !nearbyGrid.contains(card)) return;

    if (
        event.target.closest("a") ||
        event.target.closest("button")
    ) {
        return;
    }

    const propertyId = card.dataset.propertyId;

    if (!propertyId) return;

    selectNearbyProperty(propertyId);

    const marker = nearbyMarkers.find((item) => item.propertyId === propertyId);

    if (marker && nearbyMap) {
        nearbyMap.panTo(marker.getPosition());
    }
}


/* =========================================================
   GOOGLE MAPS
========================================================= */

async function loadGoogleMapsApi() {
    try {
        const response = await fetch("/map-config");

        if (!response.ok) {
            throw new Error("Could not load map config");
        }

        const config = await response.json();
        const apiKey = config.googleMapsApiKey;

        if (!apiKey) {
            console.warn("Google Maps API key is missing.");
            return;
        }

        if (window.google && window.google.maps) {
            initNearbyMap();
            return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=initNearbyMap`;
        script.async = true;
        script.defer = true;

        document.body.appendChild(script);
    } catch (error) {
        console.error("Google Maps could not be loaded:", error);
    }
}

function initNearbyMap() {
    const mapEl = document.getElementById("nearbyMap");

    if (!mapEl || typeof google === "undefined") return;

    nearbyMap = new google.maps.Map(mapEl, {
        center: DEFAULT_MAP_CENTER,
        zoom: 4,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
    });

    renderNearbyMarkers();
}

function clearNearbyMarkers() {
    nearbyMarkers.forEach((marker) => {
        marker.setMap(null);
    });

    nearbyMarkers = [];
}

function getMarkerIcon(isSelected = false) {
    const fillColor = isSelected ? SITE_ACCENT_COLOR : "#ffffff";
    const circleColor = isSelected ? "#ffffff" : SITE_ACCENT_COLOR;

    const svg = `
        <svg width="42" height="52" viewBox="0 0 42 52" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M21 1C10.5 1 2 9.5 2 20C2 34.5 21 51 21 51C21 51 40 34.5 40 20C40 9.5 31.5 1 21 1Z"
                fill="${fillColor}"
                stroke="${SITE_ACCENT_COLOR}"
                stroke-width="3"
            />

            <circle
                cx="21"
                cy="20"
                r="8"
                fill="${circleColor}"
            />
        </svg>
    `;

    return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new google.maps.Size(42, 52),
        anchor: new google.maps.Point(21, 52)
    };
}

function renderNearbyMarkers(properties = currentNearbyProperties) {
    if (!nearbyMap || typeof google === "undefined") return;

    clearNearbyMarkers();

    const bounds = new google.maps.LatLngBounds();
    let hasValidPosition = false;

    properties.forEach((item, index) => {
        const position = getPropertyPosition(item);

        if (!position) return;

        const propertyId = String(getPropertyId(item, index));

        const marker = new google.maps.Marker({
            map: nearbyMap,
            position,
            icon: getMarkerIcon(propertyId === selectedPropertyId),
            zIndex: propertyId === selectedPropertyId ? 999 : 1
        });

        marker.propertyId = propertyId;

        marker.addListener("click", () => {
            selectNearbyProperty(propertyId);

            const card = document.querySelector(
                `.nearby-card[data-property-id="${CSS.escape(propertyId)}"]`
            );

            if (card) {
                card.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "nearest"
                });
            }
        });

        nearbyMarkers.push(marker);
        bounds.extend(position);
        hasValidPosition = true;
    });

    if (hasValidPosition) {
        nearbyMap.fitBounds(bounds);
    } else {
        nearbyMap.setCenter(DEFAULT_MAP_CENTER);
        nearbyMap.setZoom(4);
    }
}

function selectNearbyProperty(propertyId) {
    selectedPropertyId = String(propertyId);

    document.querySelectorAll(".nearby-card").forEach((card) => {
        const isSelected = card.dataset.propertyId === selectedPropertyId;

        card.classList.toggle("is-selected", isSelected);

        const mapButton = card.querySelector("[data-map-button]");

        if (mapButton) {
            mapButton.classList.toggle("is-active", isSelected);
        }
    });

    nearbyMarkers.forEach((marker) => {
        const isSelected = marker.propertyId === selectedPropertyId;

        marker.setIcon(getMarkerIcon(isSelected));
        marker.setZIndex(isSelected ? 999 : 1);
    });
}

function handleMapBadgeClick(event) {
    const button = event.target.closest("[data-map-button]");

    if (!button) return;

    event.stopPropagation();

    const propertyId = button.dataset.propertyId;

    if (!propertyId) return;

    selectNearbyProperty(propertyId);

    const marker = nearbyMarkers.find((item) => item.propertyId === propertyId);

    if (marker && nearbyMap) {
        nearbyMap.panTo(marker.getPosition());
    }
}

window.initNearbyMap = initNearbyMap;


/* =========================================================
   BOOKING DATEPICKER
========================================================= */

function formatCurrency(amount) {
    return `USD $${Number(amount).toLocaleString()}`;
}

function formatDisplayDate(date) {
    return fecha.format(date, "MMM D");
}

function getTodayForDatepicker() {
    return fecha.format(new Date(), "YYYY-MM-DD");
}

function parseDateRangeValue(value) {
    if (!value || !value.includes(" - ")) {
        return null;
    }

    const parts = value.split(" - ");

    if (parts.length !== 2) {
        return null;
    }

    const checkInDate = fecha.parse(parts[0], "YYYY-MM-DD");
    const checkOutDate = fecha.parse(parts[1], "YYYY-MM-DD");

    if (!checkInDate || !checkOutDate) {
        return null;
    }

    return {
        checkInDate,
        checkOutDate
    };
}

function getNightCount(checkInDate, checkOutDate) {
    const oneDay = 1000 * 60 * 60 * 24;

    const checkInStart = new Date(
        checkInDate.getFullYear(),
        checkInDate.getMonth(),
        checkInDate.getDate()
    );

    const checkOutStart = new Date(
        checkOutDate.getFullYear(),
        checkOutDate.getMonth(),
        checkOutDate.getDate()
    );

    return Math.round((checkOutStart - checkInStart) / oneDay);
}

function updateBookingPrice(nights = 0) {
    if (pricePerNightEl) {
        pricePerNightEl.textContent = formatCurrency(PRICE_PER_NIGHT);
    }

    if (totalPriceEl) {
        totalPriceEl.textContent = formatCurrency(PRICE_PER_NIGHT * nights);
    }
}

function updateBookingDatesFromInput() {
    const range = parseDateRangeValue(bookingDateInput.value);

    if (!range) {
        updateBookingPrice(0);
        return;
    }

    const nights = getNightCount(range.checkInDate, range.checkOutDate);

    if (nights < 1) {
        updateBookingPrice(0);
        return;
    }

    checkInField.querySelector("span").textContent = formatDisplayDate(range.checkInDate);
    checkOutField.querySelector("span").textContent = formatDisplayDate(range.checkOutDate);

    updateBookingPrice(nights);
}

function initBookingDatepicker() {
    if (
        !bookingDateInput ||
        !checkInField ||
        !checkOutField ||
        typeof HotelDatepicker === "undefined" ||
        typeof fecha === "undefined"
    ) {
        return;
    }

    updateBookingPrice(0);

    const datepicker = new HotelDatepicker(bookingDateInput, {
        format: "YYYY-MM-DD",
        startDate: getTodayForDatepicker(),
        minNights: 1,
        selectForward: true,
        autoClose: false,
        clearButton: true,
        topbarPosition: "bottom",
        onSelectRange: function () {
            updateBookingDatesFromInput();
        }
    });

    checkInField.addEventListener("click", () => {
        datepicker.open();
    });

    checkOutField.addEventListener("click", () => {
        datepicker.open();
    });
}


/* =========================================================
   GALLERY MODAL
========================================================= */

function getImageFileExtension(imagePath = "") {
    const cleanPath = imagePath.split("?")[0];
    const extension = cleanPath.split(".").pop();

    return extension || "";
}

function buildGalleryImageUrl(imagePath) {
    if (!imagePath) return "";

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
    }

    return imagePath;
}

function updateGalleryCounter() {
    if (!galleryCounter) return;

    const total = galleryImages.length;
    const current = total ? activeGalleryIndex + 1 : 0;

    galleryCounter.textContent = `${current} / ${total}`;
}

function renderGalleryImages(images) {
    if (!galleryTrack) return;

    galleryImages = images;
    activeGalleryIndex = 0;

    galleryTrack.innerHTML = images
        .map((image, index) => {
            const imageUrl = buildGalleryImageUrl(image);

            return `
                <div class="gallery-slide" data-gallery-index="${index}">
                    <img
                        src="${escapeHtml(imageUrl)}"
                        alt="Property image ${index + 1}"
                        loading="lazy"
                    >
                </div>
            `;
        })
        .join("");

    updateGalleryCounter();
}

async function fetchGalleryImages() {
    const response = await fetch("/images");

    if (!response.ok) {
        throw new Error("Could not fetch gallery images");
    }

    const images = await response.json();

    if (!Array.isArray(images)) {
        return [];
    }

    return images.filter(Boolean);
}

function openGalleryModal() {
    if (!galleryModal) return;

    galleryModal.classList.add("is-open");
    galleryModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("gallery-open");
}

function closeGalleryModal() {
    if (!galleryModal) return;

    galleryModal.classList.remove("is-open");
    galleryModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("gallery-open");
}

function scrollToGalleryImage(index) {
    if (!galleryTrack || galleryImages.length === 0) return;

    const safeIndex = Math.max(0, Math.min(index, galleryImages.length - 1));
    const slide = galleryTrack.querySelector(`[data-gallery-index="${safeIndex}"]`);

    if (!slide) return;

    activeGalleryIndex = safeIndex;

    slide.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start"
    });

    updateGalleryCounter();
}

function showNextGalleryImage() {
    if (galleryImages.length === 0) return;

    const nextIndex =
        activeGalleryIndex >= galleryImages.length - 1
            ? 0
            : activeGalleryIndex + 1;

    scrollToGalleryImage(nextIndex);
}

function showPreviousGalleryImage() {
    if (galleryImages.length === 0) return;

    const previousIndex =
        activeGalleryIndex <= 0
            ? galleryImages.length - 1
            : activeGalleryIndex - 1;

    scrollToGalleryImage(previousIndex);
}

function updateGalleryIndexFromScroll() {
    if (!galleryTrack || galleryImages.length === 0) return;

    const slideWidth = galleryTrack.clientWidth;

    if (!slideWidth) return;

    activeGalleryIndex = Math.round(galleryTrack.scrollLeft / slideWidth);

    updateGalleryCounter();
}

async function handleOpenGallery() {
    openGalleryModal();

    if (galleryTrack && galleryImages.length === 0) {
        galleryTrack.innerHTML = createSkeletonCards(4);
    }

    try {
        const images = await fetchGalleryImages();

        if (images.length === 0) {
            galleryTrack.innerHTML = `
                <p class="nearby-loading">No property images found.</p>
            `;
            return;
        }

        renderGalleryImages(images);
    } catch (error) {
        if (galleryTrack) {
            galleryTrack.innerHTML = `
                <p class="nearby-loading">Could not load property images.</p>
            `;
        }

        console.error(error);
    }
}

function handleGalleryModalClick(event) {
    if (event.target.closest("[data-gallery-close]")) {
        closeGalleryModal();
    }
}

function handleGalleryKeydown(event) {
    if (!galleryModal.classList.contains("is-open")) return;

    if (event.key === "Escape") {
        closeGalleryModal();
    }

    if (event.key === "ArrowRight") {
        showNextGalleryImage();
    }

    if (event.key === "ArrowLeft") {
        showPreviousGalleryImage();
    }
}

function handleGalleryScroll() {
    window.clearTimeout(galleryTrack.scrollTimer);

    galleryTrack.scrollTimer = window.setTimeout(() => {
        updateGalleryIndexFromScroll();
    }, 80);
}


/* =========================================================
   EXPANDABLE SECTIONS
========================================================= */

function handleExpandableClick(event) {
    const button = event.target.closest(".expandable-toggle");

    if (!button) return;

    const section = button.closest(".expandable-section");

    if (!section) return;

    const isExpanded = section.classList.toggle("is-expanded");

    button.textContent = isExpanded ? "Show less" : "Show more";
    button.setAttribute("aria-expanded", isExpanded ? "true" : "false");
}

function initExpandableSections() {
    document.addEventListener("click", handleExpandableClick);
}


/* =========================================================
   INITIALIZERS
========================================================= */

function initNearbyCardActions() {
    if (!nearbyGrid) return;

    nearbyGrid.addEventListener("click", handleFavouriteClick);
    nearbyGrid.addEventListener("click", handleMapBadgeClick);
    nearbyGrid.addEventListener("click", handleNearbyCardSelection);
}

function initNearbySorting() {
    if (!nearbySort) return;

    nearbySort.value = "most-popular";

    nearbySort.addEventListener("change", () => {
        loadNearbyCards(nearbySort.value);
    });
}

function initGalleryModal() {
    if (!openGalleryBtn || !galleryModal || !galleryTrack) return;

    openGalleryBtn.addEventListener("click", handleOpenGallery);

    galleryModal.addEventListener("click", handleGalleryModalClick);

    galleryPrevBtn?.addEventListener("click", showPreviousGalleryImage);
    galleryNextBtn?.addEventListener("click", showNextGalleryImage);

    galleryTrack.addEventListener("scroll", handleGalleryScroll);

    document.addEventListener("keydown", handleGalleryKeydown);
}


/* =========================================================
   APP BOOTSTRAP
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initNearbySorting();
    initNearbyCardActions();
    initExpandableSections();
    initBookingDatepicker();
    initGalleryModal();

    loadNearbyCards("most-popular");
    loadGoogleMapsApi();
});