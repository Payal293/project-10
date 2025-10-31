function showMessage(message, isSuccess) {
  const box = document.getElementById('messageBox');
  box.textContent = message;
  box.classList.remove('success', 'error');
  box.classList.add(isSuccess ? 'success' : 'error');
  box.style.display = 'block';

  setTimeout(() => {
    box.style.display = 'none';
  }, 3000); // message disappears after 3 sec
}
function checkPassword() {
  const input = document.getElementById('password').value.trim();
  if (input === 'open121') {
    showMessage(' Door Opened! You can go now!', true);
  } else {
    showMessage(' Wrong password. Try again!', false);
  }
}

function solveMathRiddle() {
  const answer = document.getElementById('mathAnswer').value.trim();
  if (answer !== "" && parseInt(answer) === 22) {
    showMessage(" You have passed!");
  } else {
    showMessage(' Wrong answer. Try again!', false);
  }
}
// function goToPage() {
//   const answer = document.getElementById('mathAnswer').value.trim();
//    if (answer !== "" && parseInt(answer) === 22) {
//   window.location.href = "s.html";
// } else {
//   showMessage(' Wrong password. Try again!', false);
// }
// }