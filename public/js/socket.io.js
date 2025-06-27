
const socket = io('https://chatapp-api-jrpb.onrender.com', {
    transports: ["websocket"],
    timeout: 10000,
    reconnectionAttempts: 5,     // Максимум 5 попыток переподключения
    reconnectionDelay: 2000      // Интервал между попытками (2 секунды)
});

// По конвенции указываем, что мы работаем с DOM элементами прописывая ($)
const $btn = document.querySelector('#submit');
const $form = document.querySelector('#form');
const $formInput = document.querySelector('#input');
const $btnSendLocation = document.querySelector('#send__location');
const $typingProcess = document.querySelector('.typing');
const $loadingStatus = document.querySelector('#loading-indicator');

// Templates(mustache) - получаем содержимое шаблона ul/li и вставляем на страницу
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#message-location').innerHTML;
const totalUsersTemplate = document.querySelector('#total-users').innerHTML;
const $messages = document.querySelector('#messages ul');       // Куда будет вставлено содержимое шаблона
const $allUsers = document.querySelector('.chat__sidebar');

const messageSound = new Audio('sounds/notification.mp3');

// Disabled / enabled Button
function controlDisabledBtn(btn) {
    const timer = setTimeout(enableBtn, 1000);
    function enableBtn() {
        btn.removeAttribute('disabled');
        clearTimeout(timer);
    }
}


// Авто scroll при добавлении нового сообщения
function autoScroll() {
    // New message Element
    const $newMessage = document.querySelector('#messages ul').lastElementChild;
    const $container = document.querySelector('#messages');

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessagePadding = parseInt(newMessageStyles.paddingBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessagePadding;


    //Visible Height
    const visibleHeight = $container.offsetHeight;

    //Total container Height of messages container
    const containerHeight = $container.scrollHeight;

    // Scroll to
    const scrollOffset = $container.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset + 20) {
        $container.scrollTop = $container.scrollHeight;
    }

}


// --- Соединение с сервером --- //

socket.on('connect', () => {
    $loadingStatus.classList.add('connected');
});

socket.on("connect_error", (error) => {
    if (!socket.active) {
        setTimeout(() => {
            socket.connect();
        }, 3000);
    } else {
        $loadingStatus.innerHTML = `<p style="color:red;">Server is not responding. Please wait...</p>`;
    }
});



// --- Слушаем события на клиенте --- //

let userInteracted = false;                 // Необходимо для того, чтоб избегать уведомлений от chrome об использовании звуковых сообщений на странице
window.addEventListener('click', () => userInteracted = true);   // Говорим о том, что пользователь уже взаимодействует со страницей

socket.on('message', ({ msg, username, createAt, readStatus }) => {
    const status = username === 'Admin' || readStatus === 'active' ? 'active' : '';  // Помечаем прочитанные сообщения только от Admin

    // Вставка сообщений для отображения пользователю
    const html = Mustache.render(messageTemplate, {      // получение данных шаблона ul/li
        message: msg,
        username,
        createAt: moment(createAt).format("MMM h:mm a"),                                     // полученные данные
        status
    });
    $messages.insertAdjacentHTML('beforeend', html);    // вставляем данные на страницу

    autoScroll();


    if (username !== 'Admin' && userInteracted) {
        messageSound.play().catch((err) => console.warn('Can not play sound :', err));
    }

});


// --- Отображение прочитанных сообщений --- //

socket.on('userActivityUpdate', ({ isActive }) => {
    if (isActive) {
        const $iconReadMessage = document.querySelectorAll('.message i');
        $iconReadMessage.forEach((elem) => {
            if (!elem.classList.contains('active')) {
                elem.classList.add('active');
            }
        });
    }
});


if (document.visibilityState === 'visible') {    // Если вкладка пользователя активна, отправляем событие с объектом
    socket.emit('userActivity', { isActive: true });
}

document.addEventListener('visibilitychange', () => {
    const isVisible = document.visibilityState === 'visible';
    socket.emit('userActivity', { isActive: isVisible });
});


// --- Отображение кол-во пользователей в комнате --- //

socket.on('roomData', ({ room, users }) => {
    const { usersInfo, totalUsers } = users;
    const html = Mustache.render(totalUsersTemplate, {
        usersInfo,
        totalUsers,
        room
    });

    $allUsers.innerHTML = html;
});




// --- Процесс печатания --- //

socket.on('displayTyping', ({ username }) => {
    $typingProcess.firstChild.textContent = `${username} is typing`;
    $typingProcess.classList.add('typing-active');
});

socket.on('hideTyping', () => {
    $typingProcess.firstChild.textContent = '';
    $typingProcess.classList.remove('typing-active');
});

let timer;
const doneTyping = 1000;
$formInput.addEventListener('input', () => {
    socket.emit('typing');
    clearTimeout(timer);

    timer = setTimeout(() => {
        socket.emit('stopTyping');
    }, doneTyping);
});




// --- Отправка сообщения от клиента --- //

$form.addEventListener('submit', (e) => {    // №3 Пользователь отправляет свое сообщение
    e.preventDefault();

    $btn.setAttribute('disabled', true);

    const data = new FormData(e.currentTarget);

    const msg = {
        message: data.get('message'),
    };

    if (!msg?.message) {
        controlDisabledBtn($btn);
        return;
    }

    socket.emit('sendMessage', msg.message, (error) => {     //№4  Сообщение уходит на сервер. Третий аргумент ф-ия, которая оповещает, что сообщение доставлено на сервер. Данная ф-ия принимает аргумент, который содержит информацию о том, что сервер получил сообщение

        // Сообщение отправляется и очищаем поле и кнопку
        controlDisabledBtn($btn);
        $formInput.focus();
        $form.reset();

        if (error) {
            return console.log(error);
        }

        console.log('The message was delivered');
    });

});



// --- Создали новый слушатель для локации --- //

socket.on('locationMessage', ({ url, username, createAt, readStatus }) => {
    const status = readStatus === 'active' ? 'active' : '';  // Помечаем прочитанные сообщения только от Admin

    const html = Mustache.render(locationTemplate, {
        location: url,
        username,
        createAt: moment(createAt).format("MMM h:mm a"),
        status
    });
    $messages.insertAdjacentHTML('beforeend', html);

    autoScroll();

    if (username !== 'Admin' && userInteracted) {
        messageSound.play().catch((err) => console.warn('Can not play sound :', err));
    }

});


// --- Geolocation --- //

try {
    $btnSendLocation.addEventListener('click', () => {
        console.log('click');
        if (!navigator.geolocation) {                   // Если у пользователя Браузер не поддерживает геолокации
            return alert('Geolocation is not supported by your browser');
        }

        $btnSendLocation.setAttribute("disabled", true);

        navigator.geolocation.getCurrentPosition(showPosition);

        function showPosition(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const geoLocation = {
                lat,
                lon
            };

            socket.emit('sendLocation', geoLocation, (msg) => {
                controlDisabledBtn($btnSendLocation);
                console.log('Delivered!', msg);
            });
        }
    });
} catch (e) {
    console.log(e.message);
}



// Парсинг параметров url полученные при входе в chat -> ?name=David&room=private
const { username, room } = Object.fromEntries(new URLSearchParams(location.search));
const imgURL = localStorage.getItem(`avatar_${username}`);

socket.emit('join', { username, room, imgURL }, (error) => {
    console.log('join');
    if (error) {
        alert(error);
        location.href = '/';
    }
});
