const express = require("express");
const app = require("./api/index");

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Study.AI running on port ${port}`));
}

module.exports = app;
