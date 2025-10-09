document.addEventListener('DOMContentLoaded', () => {
  // Selecciona posibles contenedores externos de Rouge
  const blocks = document.querySelectorAll('.content figure.highlight, .content div.highlight');

  blocks.forEach(block => {
    // Si este contenedor tiene un ancestro .highlight, está anidado → omitir
    if (block.parentElement && block.parentElement.closest('.highlight')) return;

    // No duplicar
    if (block.dataset.copyReady === '1') return;
    block.dataset.copyReady = '1';

    // Marcar como contenedor estilizado
    block.classList.add('codebox');

    // Botón copiar
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Copiar código al portapapeles');
    btn.textContent = 'Copiar';

    // Nodo de código sin numeración (si hay), en orden de preferencia
    const codeNode =
      block.querySelector('td.code pre, td.code code, pre code, pre');

    const getCode = () => (codeNode ? codeNode.innerText : '');

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
        }, 1200);
      } catch (e) {
        const prev = btn.textContent;
        btn.textContent = 'Error';
        setTimeout(() => { btn.textContent = prev; }, 1200);
      }
    });

    block.appendChild(btn);
  });
});
