import xss from "xss";

// Recursively sanitize all string values in an object
function sanitizeObject(obj) {
  if (typeof obj === "string") return xss(obj.trim());
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, val]) => [key, sanitizeObject(val)])
    );
  }
  return obj;
}

export const sanitizeInput = (req, res, next) => {
  // Sanitize body normally — it's writable
  if (req.body) req.body = sanitizeObject(req.body);

  // Sanitize query by modifying individual keys — req.query itself is read-only
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      req.query[key] = sanitizeObject(req.query[key]);
    });
  }

  // Sanitize params by modifying individual keys
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      req.params[key] = sanitizeObject(req.params[key]);
    });
  }

  next();
};