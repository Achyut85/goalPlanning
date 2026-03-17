require('dotenv').config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
// connectDB();
app.use(express.json());


const goalPlanningRoutes = require("./routes/goalPlanning.js");


app.use("/api", goalPlanningRoutes);

// start server only when run directly (not required by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
