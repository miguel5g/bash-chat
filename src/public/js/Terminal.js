
const SPACE = '&nbsp;';
const BIGGER_THEN = '&gt;';
const LESS_THEN = '	&lt;';
let user = 'user_' + Date.now();
let room = null;

const commandsDocs = {
  comandos: {
    usage: 'comandos',
    description: 'Mostrar todos os comandos',
  },
  limpar: {
    usage: 'limpar',
    description: 'Limpar o terminal',
  },
  user: {
    usage: 'user definir [nome]',
    description: 'Definir ou retornar o nome do usuário',
  },
  sala: {
    usage: 'sala',
    description: 'Opções de sala de bate-papo',
  },
  msg: {
    usage: 'msg [mensagem]',
    description: 'Enviar uma mensagem na sala conectada',
  },
}

const commands = {
  limpar: {
    run: (terminal, args = []) => {
      terminal.clear();
    },
  },
  comandos: {
    run: (terminal, args = []) => {
      Object.keys(commandsDocs).forEach((cmd) => {
        const cmdDoc = commandsDocs[cmd];
        const outString = `<span>${cmdDoc.usage.padEnd(33, '%').split('%').join(SPACE)} - ${cmdDoc.description}</span>`;
        terminal.print(outString);
      });
    },
  },
  user: {
    run: (terminal, args = []) => {
      if (args.length <= 0) {
        const outString = `<span style="color: var(--white);">Usuário: ${user}</span>`;
        return terminal.print(outString);
      }

      if (args[0] === 'definir') {
        if (args.length < 2) {
          const outString = `<span style="color: var(--light-red);">Inválido! Use user definir ${LESS_THEN}nome${BIGGER_THEN}</span>`;
          return terminal.print(outString);
        }

        const rgx = /^[a-zA-Z0-9]+$/g;
        if (args[1].length > 4 && args[1].length < 15 && rgx.test(args[1])) {
          user = args[1];
          terminal.changeUser();
          const outString = `<span style="color: var(--green);">User alterado</span>`;
          return terminal.print(outString);
        }

        const outString = `<span style="color: var(--light-red);">User inválido!</span>`;
        return terminal.print(outString);
      }


      const outString = `<span style="color: var(--light-red);">Opção inválida!</span>`;
      return terminal.print(outString);
    },
  },
  sala: {
    run: (terminal, args = []) => {
      if (args.length <= 0) {
        const out1String = `<span style="color: var(--light-red);">Você precisa definir uma opção</span>`;
        const out2String = `<span style="color: var(--light-red);">sala [criar|entrar|listar|sair] [nome da sala]</span>`;
        return terminal.print(out1String + out2String);
      }

      switch (args[0]) {
        case 'criar':
          if (room) return terminal.print(`<span style="color: var(--light-red);">Você não pode criar uma sala enquanto estiver conectado em uma</span>`);

          if (args.length <= 1) {
            const out1String = `<span style="color: var(--light-red);">Você precisa definir um nome para sala</span>`;
            const out2String = `<span style="color: var(--light-red);">sala [criar] [nome]</span>`;
            return terminal.print(out1String + out2String);
          }

          const rgx = /^[a-zA-Z0-9]+$/g;
          if (args[1].length > 4 && args[1].length < 20 && rgx.test(args[1])) {
            const outString = `<span style="color: var(--white);">Tentando criar sala...</span>`;
            terminal.socket.emit('create_room', { name: args[1] }, (res) => {
              let resOut = '';
              if (res) {
                resOut = `<span style="color: var(--green);">Sala criada com sucesso</span>`
                  + `<span style="color: var(--white);">Envie uma mensagem usando msg [mensagem]</span>`;
                room = args[1];
              } else {
                resOut = `<span style="color: var(--light-red);">Já existe uma sala com esse nome</span>`;
              }
              return terminal.print(resOut);
            });
            return terminal.print(outString);
          }

          const outString = `<span style="color: var(--light-red);">Nome de sala inválido</span>`;
          terminal.print(outString);
          break;

        case 'entrar':
          if (room) return terminal.print(`<span style="color: var(--light-red);">Você não pode entrar em uma sala enquanto estiver conectado em uma</span>`);

          if (args.length <= 1) return terminal.print(`<span style="color: var(--light-red);">Use sala entrar [nome da sala]</span>`);

          terminal.print(`<span style="color: var(--white);">Entrando...</span>`);
          terminal.socket.emit('join_room', { name: args[1] }, (res) => {
            if (res === 404) {
              return terminal.print(`<span style="color: var(--light-red);">A sala que você está tentanto se conectar não foi encontrada</span>`);
            }

            room = args[1];
            terminal.print(`<span style="color: var(--white);">Envie uma mensagem usando msg [mensagem]</span>`);
          });
          break;

        case 'listar':
          if (room) return terminal.print(`<span style="color: var(--light-red);">Você não pode listar salas enquanto estiver conectado em uma</span>`);

          terminal.print(`<span style="color: var(--white);">Buscando salas criadas...</span>`);
          axios.get('/rooms')
            .then(({ data }) => {
              data.forEach((resRoom) => {
                terminal.print(`<span style="color: var(--white);">Nome: ${resRoom.name.padEnd(20, '%').split('%').join(SPACE)} - Pessoas: ${resRoom.size}</span>`);
              });
            })
            .catch((err) => {
              console.error(err);
              terminal.print(`<span style="color: var(--light-red);">Erro ao tentar listar salas</span>`);
            });
          break;

        case 'sair':
          if (!room) {
            return terminal.print(`<span style="color: var(--light-red);">Você não está conectado ainda</span>`);
          }

          terminal.socket.emit('quit_room', { name: room }, (res) => {
            if (res === 404) {
              room = null;
              return terminal.print(`<span style="color: var(--light-red);">A sala que você está conectado não foi encontrada</span>`);
            }

            room = null;
            terminal.print(`<span style="color: var(--white);">Desconectado com sucesso</span>`);
          });
          break;

        default:
          terminal.print(`<span style="color: var(--light-red);">Opção inválida</span>`);
          break;
      }

      if (!room) { }
    },
  },
  msg: {
    run: (terminal, args = []) => {
      if (!room) return terminal.print(`<span style="color: var(--light-red);">Você não está conectado ainda</span>`);

      if (args.length <= 0) return terminal.print(`<span style="color: var(--light-red);">Use msg [sua mensagem]</span>`);

      terminal.socket.emit('send_message', { name: room, message: args.join(' ') });
    },
  },
  default: {
    run: (terminal, args = []) => { },
  },
};

class Terminal {

  socket;
  #terminal;
  #logsContainer;
  #contentDiv;
  #userDiv;
  #isEnable = false;

  constructor(socket, terminalID = 'terminal') {
    this.#terminal = document.getElementById(terminalID);
    this.#logsContainer = document.querySelector(`#${terminalID} main`);
    this.#contentDiv = document.querySelector(`#${terminalID} > div`);
    this.#userDiv = document.querySelector(`#${terminalID} footer #user`);
    this.socket = socket;

    if (!this.#terminal || !this.#logsContainer || !this.#contentDiv || !this.#userDiv) {
      this.#isEnable = false;
    } else {
      this.#isEnable = true;

      this.changeUser();
    }

    this.socket.on('message', (data) => this.onMessage(this, data));
  }

  clear() {
    if (!this.#isEnable) return console.log('Invalid terminal id');

    this.#logsContainer.innerHTML = '';
  }

  print(value) {
    if (!this.#isEnable) return console.log('Invalid terminal id');

    this.#logsContainer.innerHTML = this.#logsContainer.innerHTML + value;
    this.#contentDiv.scrollTop = this.#contentDiv.scrollHeight;
  }

  onMessage(terminal, data) {
    terminal.print(`<span style="color: var(--white);"><i style="color: var(--green);font-weight: 600;">${data.user}</i>${SPACE}${data.message}</span>`);
  }

  printEmptyLine() {
    this.print('<span style="color: var(--background);user-select: none;">Empty line</span>')
  }

  printError(type) {
    switch (type) {
      case 'invalid_command':
        const error = `<span style="color: var(--light-red)">Comando inválido!</span>`
        this.print(error)
        break;

      default:
        break;
    }
  }

  execute(value) {
    if (!this.#isEnable) return console.log('Invalid terminal id');

    if (value.length <= 0) {
      return this.printEmptyLine();
    }

    const cmd = value.trim().split(' ')[0];
    const args = value.trim().split(' ').slice(1);

    this.print(`<span>&gt; ${value}</span>`);

    if (!commands[cmd]) return this.printError('invalid_command');

    if (room && !['sala', 'msg'].includes(cmd)) return this.print(`<span style="color: var(--light-red);">Você não pode usar este comando enquanto estiver em uma sala</span>`)

    commands[cmd].run(this, args);
  }

  changeUser(newUser = user) {
    if (!this.#isEnable) return console.log('Invalid terminal id');
    this.socket.emit('change_user', { user: newUser });
    this.#userDiv.innerHTML = newUser;
  }
}