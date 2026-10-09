import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.json({ message: "Hop App API is running" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});