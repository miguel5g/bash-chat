window.addEventListener('DOMContentLoaded', function () {
  const socket = io();
  const terminalInput = document.getElementById('terminal-input');
  const terminalContainer = document.getElementById('terminal');
  const terminal = new Terminal(socket);

  function handleInputEnter() {
    const value = terminalInput.innerText;
    terminalInput.innerHTML = '';

    terminal.execute(value);
  }

  function focusTerminal() {
    terminalInput.focus();
    const range = document.createRange();
    range.selectNodeContents(terminalInput);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  terminalInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleInputEnter();
    };
  });

  terminalContainer.addEventListener('click', function (event) {
    focusTerminal();
  });

  focusTerminal();
})