// Notion de position 
class Position {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

// Notion de hitbox
class Rectangle {
  constructor(position = new Position(), width, height) {
    this.position = position;
    this.width = width;
    this.height = height;
  }

  // Méthode qui retourne vrai s'il y a une intersection entre 2 rectangles,
  // Retourne faux sinon
  static detectCollision(r1, r2) {
    if (
      r1.position.x > (r2.position.x + r2.width) || r2.position.x > (r1.position.x + r1.width) ||
      r1.position.y > (r2.position.y + r2.height) || r2.position.y > (r1.position.y + r1.height)
    ) {
      return false;
    }

    return true;
  }

  moveTo(position = new Position()) {
    this.position.x = position.x;
    this.position.y = position.y;
  }
}

class Sprite {
  // L'argument de cette fonction doit être un objet qui à au moins ces 3 propriétés
  // constructor({ imgPath, containerEl, position })
  constructor({ imgPath = "", containerEl = document.getElementById("playground"), position = new Position(0, 0) }) {
    this.el = document.createElement("img")
    this.el.setAttribute("src", imgPath);
    // Cache l'élément tant qu'il n'a pas été chargé dans la page
    this.el.style.top = '-1000px';
    this.el.style.left = '-1000px';
    containerEl.append(this.el);

    // On a besoin des dimensions de l'image. Pour les avoir,
    // il faut attendre qu'elle finisse de se charger dans le DOM
    this.el.addEventListener('load', () => {
      // width et height doivent être obtenues depuis l'élément
      const style = getComputedStyle(this.el);
      const width = parseInt(style.width);
      const height = parseInt(style.height);
      this.hitbox = new Rectangle(position, width, height);
      this.el.style.top = position.y + 'px';
      this.el.style.left = position.x + 'px';
    });
  }

  getSize() {
    return {
      width: this.hitbox.width,
      height: this.hitbox.height
    }
  }

  getPosition() {
    return new Position(this.hitbox.position.x, this.hitbox.position.y);
  }
}

class Robot extends Sprite {
  constructor({ imgPath = "", containerEl = document.getElementById("playground"), position = new Position(0, 0) }) {
    // Appel au constructeur de Sprite
    super({ imgPath, containerEl, position });
  }
}

class Fighter extends Sprite {
  constructor({ imgPath = "", containerEl = document.getElementById("playground"), position = new Position(0, 0), isBoss = false }) {
    // Appel au constructeur de Sprite
    super({ imgPath, containerEl, position });
    this.speed = 0.4 + Math.random() * 0.7;
    this.isBoss = isBoss;
  }
}

class Game {
  // Configure le jeu
  constructor() {
    this.run = false;
    this.arrowLeft = false;
    this.arrowRight = false;
    this.lastTFrame = 0;

    this.playground = {
      el: document.getElementById("playground"),
      width: 0,
      height: 0
    }

    this.score = {
      el: document.getElementById("score"),
      value: 0
    }

    this.player = new Robot({
      imgPath: "img/R2D2.png",
      containerEl: this.playground.el,
    });

    this.fighters = [];
    this.fighterSpawnTime = 0;

    // Explicit binding
    this.handleNextFrame = this.handleNextFrame.bind(this);
  }

  // Initialise le jeu
  init() {
    const playgroundStyle = getComputedStyle(this.playground.el);
    this.playground.width = parseInt(playgroundStyle.width);
    this.playground.height = parseInt(playgroundStyle.height);

    // Gère les touches du jeu
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.arrowLeft = true;
          break;
        case "ArrowRight":
          this.arrowRight = true;
          break;
      }
    });

    document.addEventListener('keyup', (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.arrowLeft = false;
          break;
        case "ArrowRight":
          this.arrowRight = false;
          break;
      }
    });

    // Positionne le joueur 
    this.player.el.addEventListener('load', () => {
      let playerSize = this.player.getSize();
      let x = (this.playground.width - playerSize.width) / 2;
      let y = this.playground.height - playerSize.height;

      this.player.hitbox.moveTo(new Position(x, y));

      this.player.el.style.left = x + "px";
      this.player.el.style.top = y + "px";
    });
  }

  start() {
    this.run = true;
    this.fighterSpawnTime = performance.now() + 1000;

    // Début du cycle du jeu
    requestAnimationFrame(this.handleNextFrame);
  }

  // tFrame est le nombre de ms depuis le chargement de la page, 
  // donné par requestAnimationFrame et est équivalent à performance.now()
  handleNextFrame(tFrame) {
    if (this.run) {
      this.update(tFrame);
      this.render();

      this.lastTFrame = tFrame;
      requestAnimationFrame(this.handleNextFrame);
    }
  }

  // Met à jour les données du jeu
  update(tFrame) {
    this.updatePlayer(tFrame);
    this.updateFighters(tFrame);
  }

  // Met à jour les données du joueur
  updatePlayer(tFrame) {
    let direction;
    if (this.arrowLeft) {
      direction = 'left';
    } else if (this.arrowRight) {
      direction = 'right';
    }

    if (direction) {
      const distance = tFrame - this.lastTFrame;
      this.movePlayer({ direction, distance })
    }
  }

  movePlayer({ direction, distance }) {
    const playerPosition = this.player.getPosition();

    const playerSize = this.player.getSize();

    let newX;
    if (direction == 'left') {
      newX = playerPosition.x - distance;
    } else if (direction == 'right') {
      newX = playerPosition.x + distance;
    }

    if (newX < 0) {
      this.player.hitbox.moveTo(new Position(0, playerPosition.y));
    } else if (newX > this.playground.width - playerSize.width) {
      this.player.hitbox.moveTo(new Position(this.playground.width - playerSize.width, playerPosition.y));
    } else {
      this.player.hitbox.moveTo(new Position(newX, playerPosition.y));
    }
  }

  // Met à jour les données des avions/fighters
  updateFighters(tFrame) {
    // création des avions
    if (tFrame >= this.fighterSpawnTime) {
      this.spawnFighter();
      this.fighterSpawnTime = tFrame + 750 + Math.round(Math.random() * 500);
    }

    const distance = tFrame - this.lastTFrame;

    for (let i = this.fighters.length - 1; i >= 0; i--) {
      const fighter = this.fighters[i];
      const fighterPosition = fighter.getPosition();

      if (Rectangle.detectCollision(this.player.hitbox, fighter.hitbox)) {
        this.fighters.splice(i, 1);
        fighter.el.remove();

        if (fighter.isBoss) {
          // fighter = Dark Vador
          this.endGame();
        } else {
          this.score.value += 20;
        }
      } else if (fighterPosition.y > this.playground.height) {
        this.fighters.splice(i, 1);
        fighter.el.remove();

        if (fighter.isBoss) {
          // fighter = Dark Vador
          this.score.value += 100;
        } else {
          this.score.value -= (this.score.value == 0 ? 0 : 10);
        }
      } else {
        fighter.hitbox.moveTo(new Position(fighterPosition.x, fighterPosition.y + distance * fighter.speed));
      }
    }
  }

  spawnFighter() {
    // Crée l'avion
    let fighter;
    // Math.random() < 0.1 = 10% de chance d'être true 
    if (this.score.value >= 100 && Math.random() < 0.1) {
      fighter = new Fighter({ imgPath: 'img/darthvader.png', isBoss: true })
    } else {
      fighter = new Fighter({ imgPath: `img/fighter${Math.ceil(Math.random() * 4)}.png` });
    }

    // Positionne l'avion aléatoirement
    fighter.el.addEventListener('load', () => {
      let fighterSize = fighter.getSize();
      let x = Math.random() * (this.playground.width - fighterSize.width);
      let y = 0 - fighterSize.height;

      fighter.hitbox.moveTo(new Position(x, y));
      this.fighters.push(fighter);

      fighter.el.style.left = x + "px";
      fighter.el.style.top = y + "px";
    });
  }

  render() {
    // Render pour le joueur
    this.player.el.style.left = this.player.hitbox.position.x + 'px';
    this.player.el.style.top = this.player.hitbox.position.y + 'px';

    // Render pour les avions
    this.fighters.forEach(fighter => {
      fighter.el.style.left = fighter.hitbox.position.x + 'px';
      fighter.el.style.top = fighter.hitbox.position.y + 'px';
    });

    this.score.el.innerText = this.score.value;
  }

  endGame() {
    this.run = false;
    // Enlève les avions
    this.fighters.forEach(fighter => {
      fighter.el.remove();
    })

    document.querySelector('.gameover').classList.remove('hidden');
  }

  reset() {
    // Reset l'état du jeu
    this.fighters = [];
    this.score.value = 0;
    this.lastTFrame = 0;
    this.fighterSpawnTime = performance.now() + 1000;

    this.start();
  }
}

// =================== Execution code ===================
const game = new Game();
game.init();

document.querySelector('.start').addEventListener('click', () => {
  document.querySelector('.menu').classList.add('hidden');
  game.start();
});

document.querySelector('.reset').addEventListener('click', () => {
  document.querySelector('.gameover').classList.add('hidden');
  game.reset();
})
