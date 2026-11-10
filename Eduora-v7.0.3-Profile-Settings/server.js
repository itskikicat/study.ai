const express = require("express"); // Vercel Express entrypoint detection
// Local development entrypoint. Vercel routes requests to api/index.js.
const app = require("./api/index");

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`Eduora running on port ${port}`));
}

module.exports = app;
