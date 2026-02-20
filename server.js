require('dotenv').config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
connectDB();
app.use(express.json());


const goalPlanningRoutes = require("./routes/goalPlanning.js");


app.use("/api", goalPlanningRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
