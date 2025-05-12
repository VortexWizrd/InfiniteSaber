/* Variables */

var mousePosition = {
    x: 0,
    y: 0
}

// Store images
var images = {
    block: new Image(),
    blockUp: new Image(),
    blockDown: new Image(),
    blockQuestion: new Image(),
    platform: new Image()
}
images.block.src = "img/blue block.png"
images.blockUp.src = "img/blue block up.png"
images.blockDown.src = "img/blue block down.png"
images.blockQuestion.src = "img/blue block question.png"
images.platform.src = "img/platform.png"

// Store sounds
var sounds = {
    hit: new Audio('sounds/hitsound.wav')
};
sounds.hit.preservesPitch = false;
sounds.hit.volume = 0.8;

// Setup game to be globally accessible
var game = null;




/* Listeners */

// Only run game when everything has loaded
window.addEventListener('load', function() {
    // Disable scroll
    document.body.classList.add("remove-scrolling"); 

    // Define and setup canvas
    const canvas = document.querySelector("#game");
    const ctx = canvas.getContext("2d");
    ctx.canvas.width = 1920;
    ctx.canvas.height = 1080;
    resize(ctx);

    // define and setup game
    game = new Game()
    game.load()

    // create events for each upgrade
    for (let upgrade in game.upgrades) {
        if (!game.upgrades[upgrade].button) {console.log("Warning: missing button for upgrade " + upgrade); break;}
        game.upgrades[upgrade].button.addEventListener("mouseenter", function(event) {
            if (game.stats.score.value >= game.upgrades[upgrade].price) {
                game.upgrades[upgrade].button.style.backgroundColor = "var(--secondary-background-color)";
            }
        })
        game.upgrades[upgrade].button.addEventListener("mouseleave", function(event) {
            game.upgrades[upgrade].button.style.backgroundColor = "var(--background-color)";
        })

        game.upgrades[upgrade].button.addEventListener("mousedown", function(event) {
            game.upgrades[upgrade].button.style.backgroundColor = "var(--background-color)";
        })
    }

    // game loop
    function updateScreen() {
        game.update(ctx);
        requestAnimationFrame(updateScreen);
    }
    requestAnimationFrame(updateScreen); 
})

// Check mouse position 
// - Contribution: This section of the code is a modified version from 
// - https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
// - made by user1693593
document.addEventListener("mousemove", function(e) {
    const canvas = document.querySelector("#game");
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect()
    const relativeX = e.clientX - canvas.offsetLeft;
    const relativeY = e.clientY - canvas.offsetTop;
    mousePosition = {
        x: relativeX * canvas.width / rect.width,
        y: relativeY * canvas.height / rect.height
    }
});

// Detect window resize and resize canvas based on new size
window.addEventListener('resize', function() {
    const canvas = document.querySelector("#game");
    const ctx = canvas.getContext("2d");
    resize(ctx);
})

// detect store/upgrade buy
document.addEventListener('click', function(e) {
    for (let upgrade in game.upgrades) {
        if (game.upgrades[upgrade].button) { if (game.upgrades[upgrade].button.contains(e.target) ) {
            buyUpgrade(upgrade);
        }}
    }
})




/* Functions */

// setup level increase, score decrease, new price calc for buy
function buyUpgrade(upgrade) {
    if (game.stats.score.value >= game.upgrades[upgrade].price) {
        // check if max level and stop function
        if (game.upgrades[upgrade].maxLevel && game.upgrades[upgrade].maxLevel <= game.upgrades[upgrade].level) { return; }

        game.stats.score.value -= game.upgrades[upgrade].price
        game.upgrades[upgrade].level += 1;
        game.upgrades[upgrade].price = game.upgrades[upgrade].calculatePrice(game.upgrades[upgrade].level);
        if (game.upgrades[upgrade].maxLevel <= game.upgrades[upgrade].level) {
            game.upgrades[upgrade].button.querySelector('.price').innerHTML = "MAX";
        } else {
            game.upgrades[upgrade].button.querySelector('.price').innerHTML = game.upgrades[upgrade].price;
        }
        
        game.updateCounters();
        game.updateItemButtons();
    }
}

// resize the canvas
// - Contribution: This section of the code is a modified version from 
// - https://stackoverflow.com/questions/1664785/resize-html5-canvas-to-fit-window
// - made by Petr
function resize(ctx) {
    width = window.innerWidth;
    height = window.innerHeight;
    const canvasRatio = 16/9;
    const windowRatio = width / height;

  if (windowRatio > canvasRatio) {
    width = Math.floor(height * canvasRatio);
    document.getElementById("menu").style.flexDirection = "column";
    document.getElementById("menu").style.height = "100vh";
    document.getElementById("menu").style.width = "25%";
    document.getElementById("menu").style.removeProperty('left');
    document.getElementById("menu").style.right = 0;
  } else {
    height = Math.floor(width / canvasRatio);
    document.getElementById("menu").style.flexDirection = "row";
    document.getElementById("menu").style.width = "100vw";
    document.getElementById("menu").style.height = "30%";
    document.getElementById("menu").style.removeProperty('top');
  }

  ctx.canvas.style.width = `${width}px`;
  ctx.canvas.style.height = `${height}px`;
}

// generate a random integer
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function addCoordinates(coord1, coord2) {
    let sum = {}
    for (let key in coord1) {
        if (typeof coord2[key] != "undefined" && typeof coord1[key] == "number" && typeof coord2[key] == "number") {
            sum[key] = Number(coord1[key]) + Number(coord2[key]); 
        }
    }
    return sum;
}

function subtractCoordinates(coord1, coord2) {
    let diff = {}
    for (let key in coord1) {
        if (typeof coord2[key] != "undefined" && typeof coord1[key] == "number" && typeof coord2[key] == "number") {
            diff[key] = Number(coord1[key]) - Number(coord2[key]); 
        }
    }
    return diff;
}




/* Classes */

class Game {
    // store all game objects in array
    objects = [
        new Visualizer(0, 0, 1920, 1080, 14),
        new BackgroundObject(500, 900, 1089, 448, images.platform),
        new Saber(500, 500, 20, 300, 0)
    ];

    // player statistics
    stats = {
        score: {value: Number(localStorage.getItem("score")) || 0,
                counter: document.getElementById("score")},
        combo: {value: Number(localStorage.getItem("combo")) || 0,
                counter: document.getElementById("combo")},
        multiplier: {value: Number(localStorage.getItem("multiplier")) || 1, 
                     points: Number(localStorage.getItem("multiplierPoints")) || 0, 
                     counter: document.getElementById("multiplier")},
        health: {value: Number(localStorage.getItem("health")) || 50,
                 counter: document.getElementById("health")}
    }

    // player settings 
    settings = {
        jumpDistance: 12
    }

    // upgrades
    baseBlockFrequency = 5000;
    upgrades = {
        accuracy: {
            level: Number(localStorage.getItem("accuracy")) || 0,
            price: 500,
            calculatePrice: function(level) {return 500 * (level+1)},
            maxLevel: 15,
            button: document.querySelector("#accuracy")
        },
        
        blockFrequency: {
            level: Number(localStorage.getItem("blockFrequency")) || 0,
            price: 1000,
            calculatePrice: function(level) {return 1000 * 4**(level)},
            button: document.querySelector("#blockFrequency")
        },
        maxMultiplier: {
            level: Number(localStorage.getItem("maxMultiplier")) || 0,
            price: 5000,
            calculatePrice: function(level) {return 5000 * 2**(level)},
            button: document.querySelector("#maxMultiplier")
        },
        timeDependence: {
            level: Number(localStorage.getItem("timeDependence")) || 0,
            price: 10000,
            calculatePrice: function(level) {return 9500 + (500 * (level+1))},
            maxLevel: 15,
            button: document.querySelector("#timeDependence")
        },
        parity: {
            level: Number(localStorage.getItem("parity")) || 0,
            price: 1000000,
            calculatePrice: function(level) {return 1000000},
            maxLevel: 1,
            button: document.querySelector("#parity")
        },

        
    }
    

    // temporary data
    collisionsHandled = [];
    lastBlockSpawn = Date.now();
    lastBlockSwing = 0;
    lastSaveTime = Date.now();

    // calculate notes jump speed based on notes per second
    get noteJumpSpeed() {
        return ((this.notesPerSecond * 2) + 10);
    }

    // this is never used but is nice to have
    get notesPerSecond() {
        return(1 / (this.baseBlockFrequency / (this.upgrades.blockFrequency.level + 1) / 1000))
    }

    // main game loop
    update(ctx) {
        this.clear(ctx)

        this.blockSpawn(ctx);

        if (Date.now() - this.lastSaveTime >= 1000) {
            this.save();
        }

        // update every object
        let safeObjects = [];
        for (let i in this.objects) {
            this.objects[i].update(ctx, this);

            // block logic
            if (this.objects[i] instanceof Block) {

                // check if block is touching saber
                const saber = this.objects.find((object) => object instanceof Saber && object.side == this.objects[i].side);
                if (saber) {
                    if(this.objects[i].isTouching(ctx, saber)) {
                        if(this.objects[i].lastSaberPosition == null) {
                            this.objects[i].lastSaberPosition = saber.endPosition;
                        } else {
                            if (this.objects[i].lastSaberPosition.x == saber.endPosition.x && this.objects[i].lastSaberPosition.y == saber.endPosition.y) {
                                this.objects[i].deleted = true;
                                this.blockMiss();
                            } else {
                                let accuracy = Math.abs(1 - ((this.objects[i].position.x - saber.position.x) / (saber.endPosition.x - saber.position.x)))
                                if (this.objects[i].type == 1) {
                                    if (this.objects[i].lastSaberPosition.y - saber.endPosition.y > 0) {
                                        this.blockHit(this.objects[i], accuracy);
                                    } else {
                                        this.objects[i].deleted = true;
                                        this.blockMiss()
                                    }
                                } else if (this.objects[i].type == 2) {
                                    if (this.objects[i].lastSaberPosition.y - saber.endPosition.y < 0) {
                                        this.blockHit(this.objects[i], accuracy);
                                    } else {
                                        this.objects[i].deleted = true;
                                        this.blockMiss();
                                    }
                                } else {
                                    this.blockHit(this.objects[i], accuracy);
                                }
                            }
                            this.objects[i].lastSaberPosition = null;
                        }

                    }
                }

                // check if block is out of bounds
                if (this.objects[i].cornerPosition.x < -this.objects[i].size.x) {
                    this.objects[i].deleted = true;
                    this.blockMiss();
                }
            }
            
            // check if object is deleted (should be one of last steps)
            if (this.objects[i].deleted == false) {
                safeObjects.push(this.objects[i]);
            }
        }
        this.objects = safeObjects;
    }

    clear(ctx) {
        ctx.fillStyle = "#001120";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    blockHit(block, accuracy) {
        sounds.hit.playbackRate = randInt(95, 105) / 100;
        sounds.hit.currentTime = 0;
        sounds.hit.play();

        // very lucky
        if (block.type == 3) {
            let roll = randInt(0, 99);
            if (roll < 50) {
                this.stats.multiplier.value = 8* 2**(this.upgrades.maxMultiplier.level);
            } else {
                this.stats.score.value *= 10;
            }
        }


        let calculatedAccuracy = Math.round(accuracy * this.upgrades.accuracy.level) + this.upgrades.timeDependence.level;
        if (calculatedAccuracy > 15) {
            calculatedAccuracy = 15;
        }

        this.stats.score.value += (100 + calculatedAccuracy) * (this.stats.multiplier.value)
        this.stats.combo.value += 1;

        // calculate multiplier
        if (this.stats.multiplier.value < (8* 2**(this.upgrades.maxMultiplier.level))) {
            this.stats.multiplier.points += 1;
            if (this.stats.multiplier.points >= this.stats.multiplier.value * 2) {
                this.stats.multiplier.value *= 2;
                this.stats.multiplier.points = 0;
            }
        }

        this.stats.health.value += 5;
        if (this.stats.health.value >= 100) {
            this.stats.health.value = 100;
        }

        this.updateCounters();
        this.updateItemButtons();

        let visualizer = this.objects.find((obj) => obj instanceof Visualizer)
        visualizer.bars[Math.floor(visualizer.bars.length / 2)].size.y = 1000 * 2;
        block.deleted = true;
    }

    blockMiss() {
        this.stats.combo.value = 0;

        // drop multiplier
        this.multiplierPoints = 0;
        if (this.stats.multiplier.value > 1) {
            this.stats.multiplier.value /= 2;
        } else {
            this.stats.multiplier.value = 1;
        }

        // drop health
        this.stats.health.value -= 20;
        if (this.stats.health.value <= 0) {
            this.stats.score.value = Math.floor(this.stats.score.value / 2);
            this.stats.health.value = 50;
        }

        this.updateCounters();
        this.updateItemButtons();
    }

    blockSpawn(ctx) {

        if (Date.now() - this.lastBlockSpawn >= this.baseBlockFrequency / (this.upgrades.blockFrequency.level + 1)) {
            if (this.upgrades.parity.level >= 1) {
                const roll = randInt(0, 99)
                let blockType = 0
                if (this.lastBlockSwing == 1) {
                    if (roll < 1) {
                        blockType = 3;
                    } else if (roll < 10) {
                        blockType = 0
                    } else {
                        blockType = 2
                    }
                    this.objects.push(new Block(
                        ctx.canvas.width,
                        (randInt(1, 3) * 105) + 256,
                        100,
                        100,
                        0,
                        blockType
                    ))
                    this.lastBlockSwing = 0;
                } else {
                    if (roll < 1) {
                        blockType = 3;
                    } else if (roll < 10) {
                        blockType = 0
                    } else {
                        blockType = 1
                    }
                    this.objects.push(new Block(
                        ctx.canvas.width,
                        (randInt(1, 3) * 105) + 256,
                        100,
                        100,
                        0,
                        blockType
                    ))
                    this.lastBlockSwing = 1;
                }
            } else {
                this.objects.push(new Block(
                    ctx.canvas.width,
                    (randInt(1, 3) * 105) + 256,
                    100,
                    100,
                    0,
                    randInt(0, 2)
                ))
            }
            this.lastBlockSpawn = Date.now();
        }
    }

    updateCounters() {
        this.stats.score.counter.innerHTML = "Score: " + this.stats.score.value;
        this.stats.combo.counter.innerHTML = "Combo: " + this.stats.combo.value;
        this.stats.multiplier.counter.innerHTML = "Multiplier: " + this.stats.multiplier.value;
        this.stats.health.counter.value = this.stats.health.value;
    }

    updateItemButtons() {
        for (var upgrade in this.upgrades) {
            if (this.upgrades[upgrade].button) {
                this.upgrades[upgrade].button.querySelector(".price").innerHTML = this.upgrades[upgrade].price;
                if (this.upgrades[upgrade].maxLevel <= this.upgrades[upgrade].level) {
                    this.upgrades[upgrade].button.querySelector(".level").innerHTML = "MAX";
                    this.upgrades[upgrade].button.querySelector(".price").style.visibility = "hidden";
                } else {
                    if (this.stats.score.value < this.upgrades[upgrade].price) {
                        this.upgrades[upgrade].button.querySelector(".price").style.color = "var(--low-funds-color)";
                    } else {
                        this.upgrades[upgrade].button.querySelector(".price").style.color = "var(--foreground-color)";
                    }
                    this.upgrades[upgrade].button.querySelector(".level").innerHTML = this.upgrades[upgrade].level;
                    this.upgrades[upgrade].button.querySelector(".price").style.visiblity = "visible";
                }
                
            }
        }
    }

    save() {
        localStorage.setItem("score", this.stats.score.value);
        localStorage.setItem("combo", this.stats.combo.value);
        localStorage.setItem("multiplier", this.stats.multiplier.value);
        localStorage.setItem("multiplierPoints", this.stats.multiplier.points);
        localStorage.setItem("health", this.stats.health.value);

        for (let upgrade in this.upgrades) {
            localStorage.setItem(upgrade, this.upgrades[upgrade].level);
        }
    }

    load() {
        this.stats.score.value = Number(localStorage.getItem("score")) || 0;
        this.stats.multiplier.value = Number(localStorage.getItem("combo")) || 0;
        this.stats.multiplier.value = Number(localStorage.getItem("multiplier")) || 1;
        this.stats.multiplier.points = Number(localStorage.getItem("multiplierPoints")) || 0;
        this.stats.health.value = Number(localStorage.getItem("health")) || 50;

        for (let upgrade in this.upgrades) {
            this.upgrades[upgrade].level = Number(localStorage.getItem(upgrade)) || 0;
            this.upgrades[upgrade].price = this.upgrades[upgrade].calculatePrice(this.upgrades[upgrade].level)
        }

        

        this.updateCounters();
        this.updateItemButtons();
    }
}

class BackgroundObject {
    constructor(x, y, width, height, sprite) {
        this.position = {
            x: x,
            y: y
        }
        this.size = {
            x: width,
            y: height
        }

        // sprite
        this.sprite = sprite; 

        this.deleted = false;
    }

    get cornerPosition() {
        return {
            x: this.position.x - (this.size.x / 2),
            y: this.position.y - (this.size.y / 2)
        };
    }

    draw(ctx) {
        if (this.sprite) {
            ctx.drawImage(this.sprite, this.cornerPosition.x, this.cornerPosition.y, this.size.x, this.size.y);
        } else {
            ctx.fillStyle = this.color || "black";
            ctx.fillRect(this.cornerPosition.x, this.cornerPosition.y, this.size.x, this.size.y);
        }
    }

    update(ctx) {
        this.draw(ctx);
    }
}

class Visualizer extends BackgroundObject {
    constructor(x, y, width, height, bars) {
        super(x, y, width, height);
        this.position = {
            x: x,
            y: y
        }
        this.size = {
            x: width,
            y: height
        }

        this.deleted = false;

        this.bars = [];
        this.maxBars = bars;

        this.createVisualizerBars();


    }

    createVisualizerBars() {
        for(let i = 0; i < this.maxBars; i++) {
            this.bars.push(new VisualizerBar(
                (this.size.x / this.maxBars)* i + (this.size.x / this.maxBars / 2),
                1080,
                (this.size.x / this.maxBars) - 5,
                1000
            ))
        }
    }

    draw(ctx) {
        for (let i in this.bars) {
            this.bars[i].update(ctx);
        }
    }

    update(ctx) {
        this.draw(ctx);
        this.wave();
    }
    
    getMeanBarHeight() {
        let avg = 0;
        for (let i in this.bars) {
            avg += this.bars[i].size.y;
        }
        return avg / this.bars.length;
    }

    wave() {
        let originalHeight = 1000;
            for (let i = 0; i < this.bars.length; i++) {

                
                if (this.bars[i + 1] && this.bars[i + 1].size.y > this.bars[i].size.y) {
                    
                    let diff = this.bars[i + 1].size.y - this.bars[i].size.y
                    this.bars[i + 1].size.y -= diff * .01;
                    this.bars[i].size.y += diff * .2;
                }
                if (this.bars[i - 1] && this.bars[i - 1].size.y > this.bars[i].size.y) {
                    let diff = this.bars[i - 1].size.y - this.bars[i].size.y
                    this.bars[i - 1].size.y -= diff * .01;
                    this.bars[i].size.y += diff * .2;
                }

                if (Math.floor(this.bars[i].size.y) - originalHeight > 0) {
                    this.bars[i].size.y -= (this.bars[i].size.y - originalHeight) * 0.05;
                }

                
            }
    }
}

class VisualizerBar extends BackgroundObject {
    constructor(x, y, width, height, sprite) {
        super(x, y, width, height, sprite);
        this.position = {
            x: x,
            y: y
        }
        this.size = {
            x: width,
            y: height
        }

        this.deleted = false;

        this.color = "#444444"
    }
}

class GameObject {
    // store inputted data
    constructor(x, y, width, height) {
        this.position = {
            x: x,
            y: y
        }
        this.size = {
            x: width,
            y: height
        }

        // sprite
        this.sprite = null;
    }

    // Physics data
        velocity = {
        x: 0,
        y: 0
    };
    acceleration = 0;
    

    // other data
    deleted = false;

    // Calculate corner position (for drawing)
    get cornerPosition() {
        return {
            x: this.position.x - (this.size.x / 2),
            y: this.position.y - (this.size.y / 2)
        };
    }

    draw(ctx) {
        if (this.sprite) {
            ctx.drawImage(this.sprite, this.cornerPosition.x, this.cornerPosition.y, this.size.x, this.size.y);
        } else {
            ctx.fillStyle = "black";
            ctx.fillRect(this.cornerPosition.x, this.cornerPosition.y, this.size.x, this.size.y);
        }
    }

    update(ctx) {
        this.draw(ctx);
    }

    isTouching(ctx, obj) {
        // use alternate method to calculate for saber
        if (obj instanceof Saber) {
            // make linear function based off saber ends
            let saberEndPosition = obj.endPosition;
            let slope = (saberEndPosition.y - obj.position.y) / (saberEndPosition.x - obj.position.x);
            let intercept = -(obj.position.x * slope) + obj.position.y
            let minAx = null;
            let maxAx = null;
            let estimatedY = (slope * this.position.x + intercept)
            let dist = (estimatedY - this.position.y);
            if (obj.position.x <= saberEndPosition.x) {
                minAx = obj.position.x;
                maxAx = saberEndPosition.x;
            }
            else {
                minAx = saberEndPosition.x;
                maxAx = obj.position.x
            }
            if (this.position.x <= maxAx + 50 && this.position.x >= minAx - 50) {
                if (Math.abs(dist) < 50)  {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        let minAx = this.cornerPosition.x;
        let minAy = this.cornerPosition.y;
        let maxAx = this.cornerPosition.x + this.size.x;
        let maxAy = this.cornerPosition.y + this.size.y;
        let minBx = obj.cornerPosition.x;
        let minBy = obj.cornerPosition.y;
        let maxBx = obj.cornerPosition.x + obj.size.x;
        let maxBy = obj.cornerPosition.y + obj.size.y;

        return maxAx >= minBx && minAx <= maxBx && minAy <= maxBy && maxAy >= minBy;
    }
}

class Block extends GameObject {

    constructor(x, y, width, height, side, type) {
        super(x, y, width, height);
        this.position = {
            x: x,
            y: y
        }
        this.size = {
            x: width,
            y: height
        }
        this.side = side;

        
        this.sprite = images.block;

        this.type = type;

        // sprite
        switch (this.type) {
            case 0:
                this.sprite = images.block;
                break;
            case 1:
                this.sprite = images.blockUp;
                break;
            case 2:
                this.sprite = images.blockDown;
                break;
            case 3:
                this.sprite = images.blockQuestion;
                break;
        }
    }

    velocity = {
        x: -10,
        y: 0
    }

    update(ctx) {
        // block spawn njs thingy majig
        this.position = addCoordinates(this.position, this.velocity);
        if (this.position.x < game.settings.jumpDistance * 80 && this.position.x > 300) {
            this.velocity.x = -game.noteJumpSpeed / 4
        } else {
            this.velocity.x = -game.noteJumpSpeed
        }
        this.draw(ctx);
    }
}

class Saber extends GameObject {
    constructor(x, y, width, height, side) {
        super(x, y, width, height);
        this.position = {
            x: x,
            y: y
        }
        this.size = {
            x: width,
            y: height
        }
        this.side = side;
    }

    lastSaberPosition = null;

    

    get endPosition() {
        let baseV = subtractCoordinates(mousePosition, this.position)
        let unitV = {
            x: baseV.x / Math.sqrt(baseV.x**2 + baseV.y**2),
            y: baseV.y / Math.sqrt(baseV.x**2 + baseV.y**2)
        }
        return {
            x: this.position.x + (unitV.x * this.size.y),
            y: this.position.y + (unitV.y * this.size.y),
        }
    }

    draw(ctx, game) {
        if (this.sprite) {
            ctx.drawImage(this.sprite, this.cornerPosition.x, this.cornerPosition.y, this.size.x, this.size.y);
        } else {
            ctx.lineWidth = this.size.x;
            ctx.strokeStyle = "#00AAFF";
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(this.endPosition.x, this.endPosition.y)
            ctx.stroke();
        }
    }

    update(ctx, game) {
        this.draw(ctx, game);
    }
}
