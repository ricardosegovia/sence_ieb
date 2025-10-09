document.addEventListener('DOMContentLoaded', () => {
  const blocks = document.querySelectorAll('.content div.highlight, .content figure.highlight');
  blocks.forEach(block => {
    // Evitar insertar duplicado
    if (block.dataset.copyReady) return;
    block.dataset.copyReady = '1';

    // Botón
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Copiar código al portapapeles');
    btn.textContent = 'Copiar';

    // Detectar dónde está el texto real del código (sin números de línea)
    let codeNode = null;
    const table = block.querySelector('table.rouge-table');
    if (table) {
      codeNode = table.querySelector('td.code pre, td.code code, td.code');
    } else {
      codeNode = block.querySelector('pre code') || block.querySelector('pre');
    }

    const getCode = () => (codeNode ? codeNode.innerText : '');

    // Copiar al portapapeles
    btn.addEventListener('click', async () => {
      const text = getCode();
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.top = '-1000px';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        const prev = btn.textContent;
        btn.textContent = '¡Copiado!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = prev;
          btn.classList.remove('copied');
        }, 1500);
      } catch (e) {
        btn.textContent = 'Error :(';
        setTimeout(() => (btn.textContent = 'Copiar'), 1500);
      }
    });

    block.appendChild(btn);
  });
});
