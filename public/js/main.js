const $burger = document.querySelector('.burger');
const $sideBar = document.querySelector('.chat__sidebar');

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