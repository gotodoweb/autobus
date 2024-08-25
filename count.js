import { DateTime, Duration } from "luxon";

const tallin = {
    "id": 19,
    "busNumber": "206",
    "startPoint": "г. Калининград",
    "endPoint": "г. Таллин(Эстония)",
    "firstDepartureTime": "11:00",
    "frequencyMinutes": 1440
};
const timeZone = "system";



const getNextDeparture = (firstDepartureTime, frequencyMinutes) => {
    const now = DateTime.now().setZone(timeZone);
    // console.log('now: ', now());
    const [hour, minute] = firstDepartureTime.split(":").map(Number);

    let departure = DateTime.now().set({ hour, minute, second: 0, millisecond: 0 }).setZone(timeZone);
    // console.log('departure: ', departure);

    if (now > departure) {
        departure = departure.plus({ minutes: frequencyMinutes });
    }

    const endOfDay = DateTime.now().set({ hour: 23, minute: 59, second: 59 }).setZone(timeZone);

    if (departure > endOfDay) {
        departure = departure.startOf("day").plus({ days: 1 }).set({ hour, minute });
    }

    while (now > departure) {
        departure = departure.plus({ minutes: frequencyMinutes });

        if (departure > endOfDay) {
            departure = departure.startOf("day").set({ hour, minute });
        }
    }
    console.log(departure);
    return departure;
};


getNextDeparture(tallin.firstDepartureTime, tallin.frequencyMinutes);