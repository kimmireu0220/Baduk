const baduk = $('.baduk');

const login = $('.login');
const loginNav = $('.loginNav');
const loginForm = $('#login-form');
const login_id = $('#login-id');

const modal = document.getElementById("modal")
const content = $('.content');
const closeBtn = modal.querySelector(".close-area")

const modalTitle = $('.modalTitle');

let loginSuccess;

loginForm.submit(onLoginSubmit);

function onLoginSubmit(event) {
  event.preventDefault();
  const userId = login_id.val();
  if (userId) {
    modalTitle.text('로그인 성공');
    content.text(`${userId} 님 환영합니다!`);
    modal.style.display = "flex"
    login.addClass('hidden');
    loginNav.addClass('hidden');
    loginSuccess = true;
  }
  else {
    modalTitle.text('로그인 실패');
    content.text('아이디를 입력해주세요!!');
    modal.style.display = "flex"
    loginSuccess = false;
  }
}

closeBtn.addEventListener("click", e => {
  if(loginSuccess) {
    modal.style.display = "none"
    baduk.removeAttr('id');
  }
  else {
    modal.style.display = "none"
  }
})

modal.addEventListener("click", e => {
  const evTarget = e.target
  if(evTarget.classList.contains("modal-overlay")) {
    if(loginSuccess) {
      modal.style.display = "none"
      baduk.removeAttr('id');
    }
    else {
      modal.style.display = "none"
    }
  }
})

window.addEventListener("keyup", e => {
  if(modal.style.display === "flex" && e.key === "Escape") {
    if(loginSuccess) {
      modal.style.display = "none"
      baduk.removeAttr('id');
    }
    else {
      modal.style.display = "none"
    }
  }
})
