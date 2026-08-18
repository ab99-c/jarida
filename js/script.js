const sheets = document.querySelectorAll('.fb-sheet');
const totalSheets = sheets.length;
let current = 0;

function isMobile() {
  return window.innerWidth <= 768;
}

function getTotalPages() {
  return isMobile() ? totalSheets * 2 : totalSheets;
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
    
    const sheetIdx = Math.floor(current / 2);
    const sheet = sheets[sheetIdx];
    
    if (current % 2 === 0) {
      sheet.classList.add('flipped');
      sheet.style.zIndex = sheetIdx + 10;
    } else {
      sheet.style.zIndex = 1;
    }
    current += 1;
  } else {
    if (current >= totalSheets) return;
    const idx = current;
    const sheet = sheets[idx];
    
    playSound();
    sheet.classList.add('flipping');
    sheet.classList.add('flipped');
    
    setTimeout(() => { 
      sheet.style.zIndex = totalSheets + idx + 1; 
    }, 550);
    
    setTimeout(() => {
      sheet.classList.remove('flipping');
    }, 1100);

    current += 1;
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
  } else {
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
    }, 1100);
  }
}

document.querySelector('#book').addEventListener('click', event => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percentage = x / rect.width;
  
  if (percentage > 0.5) goNext();
  else goPrevious();
});

document.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') goNext();
  if (event.key === 'ArrowLeft') goPrevious();
});

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
