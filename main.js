// main.js - small utilities
document.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.getElementById('toggleTheme');
  btn && btn.addEventListener('click', ()=>{
    document.body.classList.toggle('light');
    if(document.body.classList.contains('light')) btn.textContent = 'Modo Oscuro';
    else btn.textContent = 'Modo Claro';
  });
});