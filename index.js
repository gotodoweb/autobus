import express from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import { DateTime, Duration } from "luxon";
import { WebSocketServer } from "ws";


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

app.get('/hello', (req, res) => {
    res.send("Hello world!");
});


const loadBuses = async () => {
    const data = await readFile(path.join(__dirname, "buses.json"), "utf-8");
    // console.log('data: ', data);

    // данные в формате json и мы должны их распарсить в массив
    return JSON.parse(data);
};

const getNextDeparture = (firstDepartureTime, frequencyMinutes) => {
    const now = DateTime.now().setZone(timeZone);
    // console.log('now: ', now());
    const [hour, minute] = firstDepartureTime.split(":").map(Number);

    let departure = DateTime.now().set({ hour, minute, second: 0, millisecond: 0 }).setZone(timeZone);
    // let checkDeparture = DateTime.now().set({ hour, minute, second: 0, millisecond: 0 }).setZone(timeZone);

    // console.log('departure: ', departure);

    // if (now > departure) {
    //     departure = departure.plus({ minutes: frequencyMinutes });
    // }

    const endOfDay = DateTime.now().set({ hour: 23, minute: 59, second: 59 }).setZone(timeZone);
    // console.log('endOfDay: ', endOfDay);


    

    while (now > departure) {
        departure = departure.plus({ minutes: frequencyMinutes });        

        if (departure > endOfDay) {
            departure = DateTime.now().set({ hour, minute, second: 0, millisecond: 0 }).plus({ days: 1 }).setZone(timeZone);
        }
    }

    // if (departure > endOfDay) {
    //     departure = departure.startOf("day").plus({ days: 1 }).set({ hour, minute }).setZone(timeZone);
    // }

    return departure;
};



// ВЫЧИСЛЯЕМ КОГАДА АВТОБУСЫ ОТПРАВЛЯЮТСЯ
const sendUpdatedData = async () => {
    const buses = await loadBuses();
    const now = DateTime.now().setZone(timeZone);

    const updatedBuses = buses.map((bus) => {

        const nextDeparture = getNextDeparture(bus.firstDepartureTime, bus.frequencyMinutes);
        // console.log('nextDeparture: ', nextDeparture);

        const timeRemaining = Duration.fromMillis(nextDeparture.diff(now).toMillis());
        // console.log('timeRemaining: ', timeRemaining);

        return {
            ...bus,
            nextDeparture: {
                date: nextDeparture.toFormat("yyyy-MM-dd"),
                time: nextDeparture.toFormat("HH:mm:ss"),
                remaining: timeRemaining.toFormat("hh:mm:ss"),
            }
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
    } catch (error) {
        res.send(`error from next-departure: ${error}`);
    }
});



// СОЗДАДИМ ВЕБСЕРВЕР
const wss = new WebSocketServer({ noServer: true });
const clients = new Set();

wss.on("connection", (ws) => {
    console.log("Websocket connection from index.js");
    clients.add(ws);

    const sendUpdates = async () => {
        try {
            const updatedBuses = await sendUpdatedData();
            const sortedBuses = sortBuses(updatedBuses);

            ws.send(JSON.stringify(sortedBuses));

        } catch (error) {
            console.error(`Error websocket connestion: ${error}`);
        }
    }

    const intervalId = setInterval(sendUpdates, 3000);

    ws.on('close', () => {
        clearInterval(intervalId);
        clients.delete(ws);
        console.log("Websocket closed from index.js");

    })
});

const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});


server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
    });
});