const loginNav = $('.loginNav');
const login = $('.login');
const baduk = $('.baduk');

const id = $('#id');
const loginForm = $('#login-form');

loginForm.submit(onLoginSubmit);

function onLoginSubmit(event) {
  event.preventDefault();
  login.addClass('hidden');
  loginNav.addClass('hidden');
  baduk.removeAttr('id');
  const username = id.val();  
  alert(`${username}님, 환영합니다!`);
}
