import express from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import { DateTime } from "luxon";

const __filename = url.fileURLToPath(import.meta.url);
// console.log('__filename: ', __filename);
const __dirname = path.dirname(__filename);
// console.log('__dirname: ', __dirname);

const port = 3000;
const timeZone = "system";
// const timeZone = "utc";


const app = express();

// Добавляем возможность сервера работать с нашими статичными файлами
app.use(express.static(path.join(__dirname, "public")));
/*
app.get('/hello', (req, res) => {
    res.send("Hello world!");
});

*/

const loadBuses = async () => {
    const data = await readFile(path.join(__dirname, "buses.json"), "utf-8");
    // данные в формате json и мы должны их распарсить
    return JSON.parse(data);
};

const getNextDeparture = (firstDepartureTime, frequencyMinutes) => {
    const now = DateTime.now().setZone(timeZone);
    console.log('now: ', now);
    
    const [hours, minutes] = firstDepartureTime.split(":").map(Number);

    let departure = DateTime.now().set({ hours, minutes }).setZone(timeZone);

    if (now > departure) {
        departure = departure.plus({ minutes: frequencyMinutes });
    }

    const endOfDay = DateTime.now()
        .set({ hours: 23, minutes: 59, seconds: 59 })
        .setZone(timeZone);

    if (departure > endOfDay) {
        departure = departure.startOf("day").plus({ days: 1 }).set({ hours, minutes });
    }

    while (now > departure) {
        departure = departure.plus({ minutes: frequencyMinutes });

        if (departure > endOfDay) {
            departure = departure
                .startOf("day")
                .plus({ days: 1 })
                .set({ hours, minutes });
        }
    }

    return departure;
};



// ВЫЧИСЛЯЕМ КОГАДА АВТОБУСЫ ОТПРАВЛЯЮТСЯ
const sendUpdatedData = async () => {
    const buses = await loadBuses();
    // console.log('buses: ', buses);
    console.table(buses);

    const updatedBuses = buses.map((bus) => {
        const nextDeparture = getNextDeparture(
            bus.firstDepartureTime,
            bus.frequencyMinutes
        );
        // console.log('nextDeparture: ', nextDeparture);

        return {
            ...bus,
            nextDeparture: {
                date: nextDeparture.toFormat("yyyy-MM-dd"),
                time: nextDeparture.toFormat("HH:mm:ss"),
            },
        };
    });

    return updatedBuses;
};

// const updatedBuses = sendUpdatedData();

const sortBuses = (buses) => 
    [...buses].sort(
        (a, b) => 
        new Date(`${a.nextDeparture.date}T${a.nextDeparture.time}Z`) - 
        new Date(`${b.nextDeparture.date}T${b.nextDeparture.time}Z`),
    );



app.get("/next-departure", async (req, res) => {
    try {
        const updatedBuses = await sendUpdatedData();
        // console.log('updatedBuses: ', updatedBuses);
        const sortedBuses = sortBuses(updatedBuses);
        // console.log('sortedBuses: ', sortedBuses);

        res.json(sortedBuses);
    } catch {
        res.status(500);
        res.send("error");
    }
});

app.listen(port, () => {
    console.log("Server running on http://localhost:" + port);
});
