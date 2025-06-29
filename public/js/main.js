import { socket } from './socket.io.js';

const $burger = document.querySelector('.burger');
const $sideBar = document.querySelector('.chat__sidebar');
const $messages = document.querySelector('#messages');
const $formInput = document.querySelector('.form__input');
const $hiddenInput = document.querySelector('#editing-id');


$burger.addEventListener('click', () => {
    $sideBar.classList.add('active');
});


$sideBar.addEventListener('click', (e) => {
    if (e.target && e.target.closest('div.close')) {
        $sideBar.classList.remove('active');
    }
});


$sideBar.addEventListener('click', (e) => {
    if (e.target && e.target.closest('button.exit')) {
        location.href = '/';
    }
});


$messages.addEventListener('click', (e) => {
    const parent = e.target.closest('ul .message');
    const messageElDelete = e.target.closest('ul .message .msg__actions .msg__delete');
    const messageElEdit = e.target.closest('ul .message .msg__actions .msg__edit');

    if (e.target && messageElDelete) {
        if (confirm("Delete this message?")) {
            socket.emit("deleteMessage", parent.dataset.id);
        }

    }

    if (e.target && messageElEdit) {
        const messageEl = e.target.closest('.message');
        const messageId = messageEl.dataset.id;
        const textEl = messageEl.querySelector('.msg__message');
        $formInput.value = textEl?.textContent || '';
        $hiddenInput.value = messageId;
        console.log(textEl?.textContent, messageId);
    }

});