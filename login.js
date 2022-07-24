const loginNav = $('.loginNav');
const login = $('.login');
const baduk = $('.baduk');
const login_id = $('#login-id');
const loginForm = $('#login-form');
const modal = document.getElementById("modal")
const content = $('.content');
const closeBtn = modal.querySelector(".close-area")

loginForm.submit(onLoginSubmit);

function onLoginSubmit(event) {
  event.preventDefault();
  const userId = login_id.val();
  content.text(`${userId}님 환영합니다!`);
  modal.style.display = "flex"
  login.addClass('hidden');
  loginNav.addClass('hidden');

}

closeBtn.addEventListener("click", e => {
  modal.style.display = "none"
  baduk.removeAttr('id'); 
})

modal.addEventListener("click", e => {
  const evTarget = e.target
  if(evTarget.classList.contains("modal-overlay")) {
    modal.style.display = "none"
    baduk.removeAttr('id');
  }
})

window.addEventListener("keyup", e => {
  if(modal.style.display === "flex" && e.key === "Escape") {
    modal.style.display = "none"
    baduk.removeAttr('id');
  }
})
