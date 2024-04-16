const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let schedule = [];
try {
  const data = fs.readFileSync("schedule.json", "utf8");
  schedule = JSON.parse(data);
} catch (err) {
  console.error("Error reading schedule.json file:", err);
}

app.post("/checkOverlap", (req, res) => {
  const formData = req.body;
  const { day, startTime, endTime } = formData;

  const eventsForDay = schedule.filter((event) => event.day === day);

  const overlap = eventsForDay.some((existingEvent) => {
    const existingStartTime = existingEvent.startTime;
    const existingEndTime = existingEvent.endTime;

    return (
      (startTime >= existingStartTime && startTime < existingEndTime) ||
      (endTime > existingStartTime && endTime <= existingEndTime) ||
      (startTime <= existingStartTime && endTime >= existingEndTime)
    );
  });

  if (overlap) {
    res.status(400).json({ message: "Overlap found with existing event" });
  } else {
    res.status(200).json({ message: "No overlap found" });
  }
});
app.post("/addEvent", (req, res) => {
  const formData = req.body;
  console.log("fomr data", formData);

  fs.readFile("schedule.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error reading schedule.json");
      return;
    }

    let schedule = [];
    try {
      schedule = JSON.parse(data);
      console.log("shedule ", schedule);
    } catch (parseError) {
      console.error(parseError);
      res.status(500).send("Error parsing schedule.json");
      return;
    }

    schedule.push(formData);

    fs.writeFile("schedule.json", JSON.stringify(schedule, null, 2), (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error writing to schedule.json");
        return;
      }
      console.log("Form data written to schedule.json");
      res.send("Form data received and saved successfully!");
    });
  });
});

app.get("/schedule", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "schedule.html"));
});

app.get("/api/schedule", (req, res) => {
  fs.readFile("schedule.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Error reading schedule.json" });
      return;
    }

    let schedule = [];
    try {
      schedule = JSON.parse(data);
    } catch (parseError) {
      console.error(parseError);
      res.status(500).json({ error: "Error parsing schedule.json" });
      return;
    }

    res.json(schedule);
  });
});

const port = process.env.PORT || 9001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
