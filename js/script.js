const sheets = document.querySelectorAll('.fb-sheet');
const totalSheets = sheets.length;
const indicator = document.querySelector('#indicator');
const previous = document.querySelector('#btnPrev');
const next = document.querySelector('#btnNext');
let current = 0;

function isMobile() {
  return window.innerWidth <= 768;
}

function getTotalPages() {
  return isMobile() ? totalSheets * 2 : totalSheets;
}

function update() {
  if (isMobile()) {
    // Single page mode
    indicator.textContent = `${current + 1} / ${getTotalPages()}`;
    previous.disabled = current === 0;
    next.disabled = current === getTotalPages() - 1;
  } else {
    // Double page mode
    const left = current * 2 + 1;
    const right = Math.min((current + 1) * 2, totalSheets * 2);
    indicator.textContent = `${left}-${right} / ${totalSheets * 2}`;
    previous.disabled = current === 0;
    next.disabled = current === totalSheets;
  }
}

const flipSound = new Audio('assets/page-flip.mp3');

function playSound() {
  flipSound.currentTime = 0;
  flipSound.play().catch(e => console.log("Audio play failed:", e));
}

function goNext() {
  if (isMobile()) {
    const totalPages = getTotalPages();
    if (current >= totalPages - 1) return;
    playSound();
    
    // In mobile mode, sheets are flipped one face at a time or sheet by sheet
    const sheetIdx = Math.floor(current / 2);
    const sheet = sheets[sheetIdx];
    
    if (current % 2 === 0) {
      // Flip front to back of same sheet
      sheet.classList.add('flipped');
      sheet.style.zIndex = sheetIdx + 10;
    } else {
      // Move to next sheet
      sheet.style.zIndex = 1;
    }
    current += 1;
    update();
  } else {
    // Desktop double page mode
    if (current >= totalSheets) return;
    const idx = current;
    const sheet = sheets[idx];
    
    playSound();
    sheet.classList.add('flipping');
    sheet.classList.add('flipped');
    
    setTimeout(() => { 
      sheet.style.zIndex = totalSheets + idx + 1; 
    }, 500);
    
    setTimeout(() => {
      sheet.classList.remove('flipping');
    }, 1000);

    current += 1;
    update();
  }
}

function goPrevious() {
  if (isMobile()) {
    if (current <= 0) return;
    playSound();
    current -= 1;
    const sheetIdx = Math.floor(current / 2);
    const sheet = sheets[sheetIdx];
    
    if (current % 2 === 0) {
      sheet.classList.remove('flipped');
      sheet.style.zIndex = totalSheets - sheetIdx;
    }
    update();
  } else {
    // Desktop double page mode
    if (current <= 0) return;
    current -= 1;
    const idx = current;
    const sheet = sheets[idx];
    
    playSound();
    sheet.classList.add('flipping');
    sheet.style.zIndex = totalSheets - idx;
    
    setTimeout(() => {
      sheet.classList.remove('flipped');
    }, 20);
    
    setTimeout(() => {
      sheet.classList.remove('flipping');
    }, 1000);

    update();
  }
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

window.addEventListener('resize', () => {
  update();
});

update();
