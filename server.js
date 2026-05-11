const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const IMAGES_DIR = path.join(ROOT_DIR, "images");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });

  res.end(JSON.stringify(data, null, 2));
}

function readJson(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  const fileData = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileData);
}

function getPropertyItems(fileName) {
  const jsonData = readJson(fileName);

  if (Array.isArray(jsonData)) {
    return jsonData;
  }

  if (
    jsonData &&
    jsonData.Result &&
    Array.isArray(jsonData.Result.Items)
  ) {
    return jsonData.Result.Items;
  }

  return [];
}

function applyLimit(items, limitValue) {
  if (!limitValue) return items;

  const limit = Number.parseInt(limitValue, 10);

  if (!Number.isFinite(limit) || limit < 1) {
    return items;
  }

  return items.slice(0, limit);
}

function handleGetProperty(reqUrl, res) {
  const params = reqUrl.searchParams;

  let fileName = "most_popular.json";

  if (params.get("most-popular") === "true") {
    fileName = "most_popular.json";
  } else if (params.get("highest-price") === "true") {
    fileName = "highest_price.json";
  } else if (params.get("lowest-price") === "true") {
    fileName = "lowest_price.json";
  }

  try {
    const items = getPropertyItems(fileName);
    const limitedItems = applyLimit(items, params.get("limit"));

    sendJson(res, 200, limitedItems);
  } catch (error) {
    sendJson(res, 500, {
      error: "Could not read property data",
      details: error.message
    });
  }
}

function handleImages(res) {
  try {
    const images = fs
      .readdirSync(IMAGES_DIR)
      .filter((file) => /\.(jpg|jpeg|png|webp|svg)$/i.test(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .slice(0, 10)
      .map((file) => `/images/${file}`);

    sendJson(res, 200, images);
  } catch (error) {
    sendJson(res, 500, {
      error: "Could not read images folder",
      details: error.message
    });
  }
}

function serveStatic(reqUrl, res) {
  let pathname = decodeURIComponent(reqUrl.pathname);

  if (pathname === "/") {
    pathname = "/index.html";
  }

  const filePath = path.normalize(path.join(ROOT_DIR, pathname));

  if (!filePath.startsWith(ROOT_DIR)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { error: "File not found" });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType
    });

    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && reqUrl.pathname === "/get-property") {
    handleGetProperty(reqUrl, res);
    return;
  }

  if (req.method === "GET" && reqUrl.pathname === "/images") {
    handleImages(res);
    return;
  }

  serveStatic(reqUrl, res);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});