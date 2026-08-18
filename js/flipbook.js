const sheets = document.querySelectorAll('.fb-sheet');
const total = sheets.length;
const indicator = document.querySelector('#indicator');
const previous = document.querySelector('#btnPrev');
const next = document.querySelector('#btnNext');
let current = 0;

function update() {
  const left = current * 2 + 1;
  const right = Math.min((current + 1) * 2, total * 2);
  indicator.textContent = `صفحة ${left}-${right} / ${total * 2}`;
  previous.disabled = current === 0;
  next.disabled = current === total;
}
function goNext() {
  if (current >= total) return;
  const sheet = sheets[current]; sheet.classList.add('flipped');
  setTimeout(() => { sheet.style.zIndex = total - current; }, 450);
  current += 1; update();
}
function goPrevious() {
  if (current <= 0) return;
  current -= 1; const sheet = sheets[current]; sheet.style.zIndex = total - current;
  setTimeout(() => sheet.classList.remove('flipped'), 50); update();
}
next.addEventListener('click', goNext); previous.addEventListener('click', goPrevious);
document.querySelector('#book').addEventListener('click', event => {
  const rect = event.currentTarget.getBoundingClientRect(); const x = event.clientX - rect.left;
  if (x > rect.width * .55) goNext(); else if (x < rect.width * .45) goPrevious();
});
document.addEventListener('keydown', event => { if (event.key === 'ArrowRight') goNext(); if (event.key === 'ArrowLeft') goPrevious(); });
let touchStart = 0;
document.addEventListener('touchstart', event => { touchStart = event.touches[0].clientX; });
document.addEventListener('touchend', event => { const delta = touchStart - event.changedTouches[0].clientX; if (Math.abs(delta) > 50) delta > 0 ? goNext() : goPrevious(); });
update();
