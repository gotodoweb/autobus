const fetchBusData = async () => {
    try {
        const response = await fetch("/next-departure");

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        };

        return response.json();        
    } catch {
        console.log(`Error fetching bus data : ${error}`);
    }

};


const formatDate = (date) => date.toISOString().split('T')[0];
const formatTime = (date) => date.toTimeString().split(' ')[0].slice(0, 5);
const timeZone = "system";

const getTimeRemainingSeconds = (departureTime) => {
    const now = new Date();
    const timeDeference = departureTime - now;
    return Math.floor(timeDeference / 1000);
    
}

// const timenow = new Date().toLocaleTimeString('en-US', { 
//     hour12: false, 
//     hour: "numeric", 
//     minute: "numeric"
// });

const renderBusData = (buses) => {    
    const tableBody = document.querySelector('#bus tbody');
    tableBody.textContent = '';

    // будем работать с данными здесь
    buses.forEach((bus) => {
        const row = document.createElement('tr');

        const nextDepartureDateTimeUTC = new Date(`${bus.nextDeparture.date}T${bus.nextDeparture.time}`);
        // console.log('nextDepartureDateTimeUTC: ', nextDepartureDateTimeUTC);
        // console.log(formatDate(nextDepartureDateTimeUTC));
        // console.log(formatTime(nextDepartureDateTimeUTC));

        const remainingSeconds = getTimeRemainingSeconds(nextDepartureDateTimeUTC);
        const remainingTimeText = remainingSeconds < 60 ? "Отправляется " : bus.nextDeparture.remaining;

        row.innerHTML = `
            <td>${bus.busNumber}</td>
            <td>${bus.startPoint} - ${bus.endPoint}</td>
            <td>${formatDate(nextDepartureDateTimeUTC)}</td>
            <td>${formatTime(nextDepartureDateTimeUTC)}</td>
            <td>${remainingTimeText}</td>
        `;
        tableBody.append(row);
    });

    // console.log(buses);
};

const initWebSocket = () => {
    const ws = new WebSocket(`ws://${location.host}`);

    ws.addEventListener('open', () => {
        console.log("Websocket connection (from script.js) ");
    });

    ws.addEventListener('message', (event) => {
        const buses = JSON.parse(event.data);
        // console.log('buses: ', buses);
        renderBusData(buses);
    });
    ws.addEventListener('error', (error) => {
        console.log(`WebsSocket error: ${error}`);
    });
    ws.addEventListener('close', () => {
        console.log(`WebsSocket connetion closed`);
    });
};


const updateTime = () => {
    const currentTimeElement = document.querySelector("#current-time");
    const now = new Date();
    currentTimeElement.textContent = now.toTimeString().split(" ")[0];

    setTimeout(updateTime, 1000);
}


// функция инициализации
const init = async () => {
    const buses = await fetchBusData();
    renderBusData(buses);

    initWebSocket();

    updateTime();
};

init();