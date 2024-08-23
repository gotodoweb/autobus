// import { response } from "express";
// import { DateTime } from "luxon";
// пишем функцию которая будет делать запрос и заполнять нашу таблицу
const fetchBusDate = async () => {
    try {
        const response = await fetch("/next-departure");

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        };

        const buses = response.json();

        return buses;
    } catch (error) {
        console.log(`Error fetching bus data : ${error}`);
    }

};


const formatDate = (date) => date.toISOString().split('T')[0];
const formatTime = (date) => date.toTimeString().split(' ')[0].slice(0, 5);
// const timeZone = "system";
const timenow = new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: "numeric", 
    minute: "numeric"
});;

const renderBusData = (buses) => {
    

    const tableBody = document.querySelector('#bus tbody');
    tableBody.textContent = '';

    // будем работать с данными здесь
    buses.forEach((bus) => {
        const row = document.createElement('tr');

        const nextDepartureDateTimeUTC = new Date(`${bus.nextDeparture.date}T${bus.nextDeparture.time}Z`,);
        // console.log('nextDepartureDateTimeUTC: ', nextDepartureDateTimeUTC);

        row.innerHTML = `
            <td>${bus.busNumber}</td>
            <td>${bus.startPoint} - ${bus.endPoint}</td>
            <td>${formatDate(nextDepartureDateTimeUTC)}</td>
            <td>${formatTime(nextDepartureDateTimeUTC)}</td>
            <td>${timenow}</td>
        `;
        tableBody.append(row);
    })

    console.log(buses);
};

// функция инициализации
const init = async () => {
    const buses = await fetchBusDate();
    renderBusData(buses);
};

init();