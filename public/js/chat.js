const $joinForm = document.querySelector('.join-form');
const $select = document.querySelector("#select");

const selectOptionsTemplate = document.querySelector('#select-options').innerHTML;


const rooms = JSON.parse(localStorage.getItem('room')) || [];
if (rooms) {
    const html = Mustache.render(selectOptionsTemplate, {
        chat: rooms,
    });
    $select.insertAdjacentHTML('beforeend', html);
}


$joinForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = new FormData(e.currentTarget);

    const formData = {
        username: data.get('username'),
        roomData: data.get('room'),
        select: data.get('select'),
        file: data.get('avatar')
    };

    if (!formData.roomData && !formData.select) {
        alert('Please make your choice between custom room or select existing');
        return;
    }

    const { username, roomData, select, file } = formData;
    const room = roomData || select;
    const isDuplicateRoom = rooms.map((item) => item.toLowerCase()).includes(roomData.toLowerCase());

    if (isDuplicateRoom) {
        alert('The room provided already exist');
        return;
    }

    if (roomData) {
        rooms.push(roomData);
        localStorage.setItem('room', JSON.stringify(rooms));
        const html = Mustache.render(selectOptionsTemplate, {
            chat: room,
        });
        $select.insertAdjacentHTML('beforeend', html);
    }

    function encodeImageFileAsURL(elem) {
        let reader = new FileReader();

        reader.onloadend = function () {
            const avatarKey = `avatar_${username}`;
            localStorage.setItem(avatarKey, file.name ? reader.result : "./assets/avatar.png");
        };

        reader.readAsDataURL(elem);
    }

    encodeImageFileAsURL(file);

    window.location.href = `chat.html?username=${encodeURIComponent(username)}&room=${encodeURIComponent(room)}`;

});




