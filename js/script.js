const sheets = document.querySelectorAll('.fb-sheet');
const total = sheets.length;
const indicator = document.querySelector('#indicator');
const previous = document.querySelector('#btnPrev');
const next = document.querySelector('#btnNext');
let current = 0;

function update() {
  const left = current * 2 + 1;
  const right = Math.min((current + 1) * 2, total * 2);
  indicator.textContent = `${left}-${right} / ${total * 2}`;
  previous.disabled = current === 0;
  next.disabled = current === total;
}

function goNext() {
  if (current >= total) return;
  const idx = current;
  const sheet = sheets[idx];
  
  sheet.classList.add('flipping');
  sheet.classList.add('flipped');
  
  // Dynamic Z-index management
  setTimeout(() => { 
    sheet.style.zIndex = total + idx + 1; 
  }, 600);
  
  setTimeout(() => {
    sheet.classList.remove('flipping');
  }, 1200);

  current += 1;
  update();
}

function goPrevious() {
  if (current <= 0) return;
  current -= 1;
  const idx = current;
  const sheet = sheets[idx];
  
  sheet.classList.add('flipping');
  sheet.style.zIndex = total - idx;
  
  setTimeout(() => {
    sheet.classList.remove('flipped');
  }, 20);
  
  setTimeout(() => {
    sheet.classList.remove('flipping');
  }, 1200);

  update();
}

next.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });
previous.addEventListener('click', (e) => { e.stopPropagation(); goPrevious(); });

// Click on book edges
document.querySelector('#book').addEventListener('click', event => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percentage = x / rect.width;
  
  if (percentage > 0.6) goNext();
  else if (percentage < 0.4) goPrevious();
});

// Keyboard
document.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') goNext();
  if (event.key === 'ArrowLeft') goPrevious();
});

// Touch Events (Swipe)
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, {passive: true});

document.addEventListener('touchend', e => {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const dx = touchStartX - touchEndX;
  const dy = touchStartY - touchEndY;
  
  if (Math.abs(dx) > 50 && Math.abs(dy) < 100) {
    if (dx > 0) goNext();
    else goPrevious();
  }
}, {passive: true});

update();
