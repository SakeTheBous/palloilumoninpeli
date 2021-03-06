/*
Otetaan käyttöön kirjastot:
Express - 
    http server kirjasto, käytetään vain lähinnä
    tiedostojen lähettämiseen käyttäjälle
http -
    NodeJS:n oma http kirjasto
Socket.io -
    WebSocket kirjasto, käytetään websocketien 
    lähettämiseen ja vastaanottamiseen
Matter.js -
    2D-fysiikka kirjasto, käytetään pelin fysiikaan
*/
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Matter = require('matter-js/build/matter.js');

// Portti jossa peliserveri on
var gamePort = 3320;

// Pelin loop, tässä vaiheessa muuttuja vain tehdään
// globaaliksi, jotta sitä voidaan käyttää funktioiden sisällä
// JavaScriptissä funktiot voivat käyttää muuttujia, jotka
// on tehty funktion ulkopuolella (globaaleja)
var gameLoop;

// Onko peli käynnissä, tässä vaiheessa tietenkin ei
var gameStarted = false;

// Kaikki pelaajat, taulukko
var players = [];

//kulmat
var corners = {
    x_upperLeft: 0,
    y_upperLeft: 0,
    x_lowerLeft: 0,
    y_lowerLeft: 800,
    x_upperRight: 800,
    y_upperRight: 0,
    x_lowerRight: 800,
    y_lowerRight: 800 
};

// Värit
var colors = [
    "#FF5722",
    "#009688",
    "#E91E63",
    "#03A9F4",
    "#002147",
    "#CFDC00",
    "#030820",
    "#01FF70"
];

// App-objektiin laitettiin ylempänä express-serveri
// .get()-funktiolla voidaan päättää mitä tapahtuu
// kun selaimella mennään ensimmäisen parametrin mukaiseen
// osoitteeseen. '/' tarkoittaa siis etusivua esim 'rikuwikman.net'
app.get('/', function(req, res) {
    // req parametri on pyyntö minkä käyttäjän selain lähetti,
    // res parametri on vastaus minkä serveri lähettää takaisin

    // Tässä siis lähetetään takaisin client.html-tiedosto
    res.sendfile('client.html');
});

// Sama kuin ylempänä, mutta kun käyttäjä pyytää tässä client_multi.js
// tiedostoa, jossa on siis käyttäjän puolen JavaScript
app.get('/client_multi.js', function(req, res) {
    // Lähetetään siis takaisin JavaScript-tiedosto client_multi.js
    res.sendfile('client_multi.js');
});

// io on muuttuja, jossa on Socket.io kirjasto
// .on('connection', function() {}) laukaisee parametrinä annetun funktion
// kun uusi WebSocket-yhteys muodostuu
// parametrinä annetussa funktiossa taas on parametrinä itse kyseinen WebSocket
io.on('connection', function(socket) {
    // Tallennetaan pelaajan ID
    var id = socket.id.substring(2);

    console.log('Pelaaja liittyi peliin, ID : ' + id);
    
    // Tehdään uusi Player-luokka pelaajalle 
    // (luokka on lähes täysin sama asia kuin object tai struct C# puolella)
    var player = new Player(id);

    // Lisätään juuri tehty Player-luokka pelaajien taulukkoon
    players.push(player);

    // Lisätään pelaajan pallo maailmaan
    Matter.World.add(engine.world, [player.ball, player.constraint]);

    // Käynnistetään peli, jos se ei ole jo käynnissä
    toggleGameState(false);
    
    // Kun WebSocket suljetaan, tämä laukaisee parametrinä annetun funktion
    socket.on('disconnect', function(player) {
        removePlayer(id);
    });

    // Kun WebSocket saa 'client_update' tapahtuman, laukaisee seuraavan funktion
    socket.on('client_update', function(player) {
        var playersAmount = players.length;

        // Käydään läpi kaikki pelaajat ja jos ID vastaa WebSocket-tapahtuman ID:tä
        // päivitetään pelaajan pallon sijaintia, pallon sijainti selitetään alempana
        // Player-luokan kohdalla
        for (var i=0; i < playersAmount; i++) {
            if (players[i].pid === player.pid) {
                players[i].constraint.pointA = player.pos;
                players[i].name = player.name;
            }
        }
    });

    socket.on('death', function() {
        removePlayer(id);
    });

    socket.on('rejoin', function() {
        // Tehdään uusi Player-luokka pelaajalle 
        // (luokka on lähes täysin sama asia kuin object tai struct C# puolella)
        var player = new Player(id);

        // Lisätään juuri tehty Player-luokka pelaajien taulukkoon
        players.push(player);

        // Lisätään pelaajan pallo maailmaan
        Matter.World.add(engine.world, [player.ball, player.constraint]);
    });

    // Kun WebSocket saa 'pause_game' tapahtuman, laukaisee seuraavan funktion
    socket.on('pause_game', function() {
        toggleGameState(true);
    });
});

// Laitetaan serveri päälle kuuntelemaan porttia, joka määritettiin ylempänä
http.listen(gamePort, function() {
  console.log('Pelipalvelin online-tilassa ja kuuntelee porttia : ' + gamePort);
});

// Matter.js fysiikkamoottori
var engine = Matter.Engine.create();

// Pelipallo
var playBall = Matter.Bodies.circle(400, 200, 20, {  frictionAir: 0 });

// Lattia
var floor = Matter.Bodies.rectangle(800, 800, 1600, 60, { isStatic: true });

// Vasen seinä
var wallLeft = Matter.Bodies.rectangle(0, 500, 60, 1200, { isStatic: true });

// Oikea seinä
var wallRight = Matter.Bodies.rectangle(800, 500, 60, 1200, { isStatic: true });

// Katto
var roof = Matter.Bodies.rectangle(800, 0, 1600, 60, { isStatic: true });

//Vasen alakulma
var leftDown = Matter.Bodies.rectangle(corners.x_lowerLeft, corners.y_lowerLeft, 500, 385, { isStatic: true, angle: -Math.PI * 0.75 });

//Vasen yläkulma
var leftUp = Matter.Bodies.rectangle(corners.x_upperLeft, corners.y_upperLeft, 500, 385, { isStatic: true, angle: -Math.PI * 0.25 });

//Oikea alakulma
var rightDown = Matter.Bodies.rectangle(corners.x_lowerRight, corners.y_lowerRight, 500, 385, { isStatic: true, angle: -Math.PI * 0.25 });

//Oikea yläkulma
var rightUp = Matter.Bodies.rectangle(corners.x_upperRight, corners.y_upperRight, 500, 385, { isStatic: true, angle: -Math.PI * 0.75 });

// Pelialueet taulukko

var gameAreas = [];

// Pelialueiden määrittely, määritetään rajapisteet

for (var i=0; i<8; i++) {
    switch (i) {
        case 0:
            gameAreas.push({
                pid: null,
                center: {
                    x: 400,
                    y: 400
                },
                leftX: 800 / 3 * 2 + 24,
                rightX: 800 / 3 - 24,
                leftY: 27.5,
                rightY: 27.5
            });
            break;
        case 1:
            gameAreas.push({
                pid: null,
                center: {
                    x: 400,
                    y: 400
                },
                leftX: 800 / 3 - 24,
                rightX: 800 / 3 * 2 + 24,
                leftY: 772.5,
                rightY: 772.5
            });
            break;
        case 2:
            gameAreas.push({
                pid: null,
                center: {
                    x: 400,
                    y: 400
                },
                leftX: 27.5,
                rightX: 27.5,
                leftY: 800 / 3 - 24,
                rightY: 800 / 3 * 2 + 24
            });
            break;
        case 3:
            gameAreas.push({
                pid: null,
                center: {
                    x: 400,
                    y: 400
                },
                leftX: 772.5,
                rightX: 772.5,
                leftY: 800 / 3 * 2 + 24,
                rightY: 800 / 3 - 24
            });
            break;
        case 4:
            gameAreas.push({
                pid: null,
                center: {
                    x: 400,
                    y: 400
                },
                leftX: 800 / 3 - 24,
                rightX: 27.5,
                leftY: 27.5,
                rightY: 800 / 3 - 24
            });
            break;
        case 5:
            gameAreas.push({
                pid: null,
                center: {
                    x: 400,
                    y: 400
                },
                leftX: 800 / 3 * 2 + 24,
                rightX: 772.5,
                leftY: 772.5,
                rightY: 800 / 3 * 2 + 24
            });
            break;
        case 6:
            gameAreas.push({
                pid: null,
                center: {
                    x: 400,
                    y: 400
                },
                leftX: 772.5,
                rightX: 800 / 3 * 2 + 24,
                leftY: 800 / 3 - 24,
                rightY: 27.5
            });
            break;
        case 7:
            gameAreas.push({
                pid: null,
                center: {
                    x: 400,
                    y: 400
                },
                leftX: 27.5,
                rightX: 800 / 3 - 24,
                leftY: 800 / 3 * 2 + 24,
                rightY: 772.5
            });
            break;
    }
}

// Asetetaan painovoima, kimmoisuus jne..
engine.world.gravity.x = 0;
engine.world.gravity.y = 0;
engine.world.friction = 0;
engine.world.bounds.max.x = 1000;
engine.world.bounds.max.y = 1000;
floor.restitution = 1;
wallLeft.restitution = 1;
wallRight.restitution = 1;
roof.restitution = 1;
leftDown.restitution = 1;
leftUp.restitution = 1;
rightDown.restitution = 1;
rightUp.restitution = 1;
playBall.restitution = 0.5;
Matter.Body.setMass(playBall, 10);

Matter.Events.on(engine, 'collisionStart', function(event) {
    var pairs = event.pairs;
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        if (pair.bodyA.id == playBall.id) {
            switch (pair.bodyB.id) {
                case floor.id:
                    if (typeof players[1] !== 'undefined') {
                        if (players[1].lives > 1) {
                            players[1].lives--;
                        } else {
                            removePlayer(players[1].pid);
                        }
                    }

                    break;
                case roof.id:
                    if (typeof players[0] !== 'undefined') {
                        if (players[0].lives > 1) {
                            players[0].lives--;
                        } else {
                            removePlayer(players[0].pid);
                        }
                    }

                    break;
                case wallLeft.id:
                    if (typeof players[2] !== 'undefined') {
                        if (players[2].lives > 1) {
                            players[2].lives--;
                        } else {
                            removePlayer(players[2].pid);
                        }
                    }

                    break;
                case wallRight.id:
                    if (typeof players[3] !== 'undefined') {
                        if (players[3].lives > 1) {
                            players[3].lives--;
                        } else {
                            removePlayer(players[3].pid);
                        }
                    }

                    break;
                case leftDown.id:
                    if (typeof players[4] !== 'undefined') {
                        if (players[4].lives > 1) {
                            players[4].lives--;
                        } else {
                            removePlayer(players[4].pid);
                        }
                    }

                    break;
                case leftUp.id:
                    if (typeof players[5] !== 'undefined') {
                        if (players[5].lives > 1) {
                            players[5].lives--;
                        } else {
                            removePlayer(players[5].pid);
                        }
                    }

                    break;
                case rightDown.id:
                    if (typeof players[6] !== 'undefined') {
                        if (players[6].lives > 1) {
                            players[6].lives--;
                        } else {
                            removePlayer(players[6].pid);
                        }
                    }

                    break;
                case rightUp.id:
                    if (typeof players[7] !== 'undefined') {
                        if (players[7].lives > 1) {
                            players[7].lives--;
                        } else {
                            removePlayer(players[7].pid);
                        }
                    }

                    break;
            }
        } else if (pair.bodyB.id == playBall.id) {
            switch (pair.bodyA.id) {
                case floor.id:
                    if (typeof players[1] !== 'undefined') {
                        if (players[1].lives > 1) {
                            players[1].lives--;
                        } else {
                            removePlayer(players[1].pid);
                        }
                    }

                    break;
                case roof.id:
                    if (typeof players[0] !== 'undefined') {
                        if (players[0].lives > 1) {
                            players[0].lives--;
                        } else {
                            removePlayer(players[0].pid);
                        }
                    }

                    break;
                case wallLeft.id:
                    if (typeof players[2] !== 'undefined') {
                        if (players[2].lives > 1) {
                            players[2].lives--;
                        } else {
                            removePlayer(players[2].pid);
                        }
                    }

                    break;
                case wallRight.id:
                    if (typeof players[3] !== 'undefined') {
                        if (players[3].lives > 1) {
                            players[3].lives--;
                        } else {
                            removePlayer(players[3].pid);
                        }
                    }

                    break;
                case leftDown.id:
                    if (typeof players[4] !== 'undefined') {
                        if (players[4].lives > 1) {
                            players[4].lives--;
                        } else {
                            removePlayer(players[4].pid);
                        }
                    }

                    break;
                case leftUp.id:
                    if (typeof players[5] !== 'undefined') {
                        if (players[5].lives > 1) {
                            players[5].lives--;
                        } else {
                            removePlayer(players[5].pid);
                        }
                    }

                    break;
                case rightDown.id:
                    if (typeof players[6] !== 'undefined') {
                        if (players[6].lives > 1) {
                            players[6].lives--;
                        } else {
                            removePlayer(players[6].pid);
                        }
                    }

                    break;
                case rightUp.id:
                    if (typeof players[7] !== 'undefined') {
                        if (players[7].lives > 1) {
                            players[7].lives--;
                        } else {
                            removePlayer(players[7].pid);
                        }
                    }

                    break;
            }
        }
    }
});

// Lisätään esineet maailmaan
Matter.World.add(engine.world, [playBall, floor, wallLeft, wallRight, roof, leftDown, leftUp, rightDown, rightUp]);

// Annetaan pelipallolle alkusijainti
playBall.position = { x: 400, y: 210 };

/*
Funktio, joka käynnistää pelin tai pausettaa pelin mikäli peli on käynnissä
*/
function toggleGameState(quit)
{
    // Jos peli ei ole käynnissä eikä haluta pausettaa peliä
    if (!gameStarted && !quit) {
        gameStarted = true;
        console.log("----- Aloitetaan peli -----");

        // Aloitetaan loop, joka päivittää esineiden sijaintia ja lähettää ne clienteille
        gameLoop = setInterval(function() {

            // Alla olevat kolme riviä päivittävät pelimaailmaa
            Matter.Events.trigger(engine, 'tick', { timestamp: engine.timing.timestamp });
            Matter.Engine.update(engine, engine.timing.delta);
            Matter.Events.trigger(engine, 'afterTick', { timestamp: engine.timing.timestamp });

            /*
                Käydään kaikki pelaajat läpi ja lisätään ne objektiin jossa jäsenet ovat pelaajien ID
                nimisiä, jotka ovat myös itse objekteja, joilla on x ja y arvot
                Esimerkiksi:
                playersData = {
                    vwWRsdkSAld: {
                        x: 10,
                        y: 10
                    }
                };
            */
            var playersAmount = players.length;
            var playersData = {};
            var ballsData = {};

            io.sockets.emit('update', playBall.position);

            for (var i=0; i < playersAmount; i++) {
                // Jos indexillä oleva pelaaja on olemassa, tässä siitä syystä että jos pelaaja
                // poistetaan samalla kun tämä loop on käynnissä, saattaa tulla index undefined error
                // jos pelaaja on ehditty poistamaan
                if (typeof players[i] !== 'undefined') {
                    // Lisätään pelaajan sijainti tiedot playersData objektiin
                    playersData[players[i].pid] = { pos: players[i].ball.position, name: players[i].name, color: players[i].color, area: players[i].gamearea };
                }
            }

            // Lähetetään playersData kaikille WebSocket-yhteyksille
            io.sockets.emit('update_players', playersData);
            // Lähetetään pelialue data kaikille
            io.sockets.emit('update_areas', gameAreas);
        }, 10);
    } else if (quit) {
        // Pausetetaan peli
        console.log("----- Pausetetaan peli -----");
        gameStarted = false;
        // Suljetaan gameLoop, joka tehtiin setIntervalilla, clearInterval lopettaa sen
        clearInterval(gameLoop);
    }
}

function removePlayer(id)
{
    console.log('Pelaaja poistui pelista, ID : ' + id);
    // Otetaan pelaajat-taulukon pituus, niin sitä ei tarvitse for-lauseessa
    // laskea kokoajan uudelleen
    var playersLen = players.length;
    // Pelin sulkeneen pelaajan paikka pelaajat taulukossa
    var playerIndex = null;
    // Käydään läpi kaikki pelaajat players-taulukosta ja mikäli ID vastaa
    // WebSocketin sulkeneen pelaajan ID:tä, tallennetaan paikka playerIndexiin
    for (var i = 0; i < playersLen; i++) {
        if (players[i].pid === id) {
            playerIndex = i;
            break;
        }
    }

    // Käydään läpi pelialueet ja poistetaan pelaaja pelialueelta jos ID vastaa
    // WebSocketin sulkeneen pelaajan ID:tä
    var areasLen = gameAreas.length;
    for (var i = 0; i < areasLen; i++) {
        if (gameAreas[i].pid === id) {
            gameAreas[i].pid = null;

            break;
        }
    }

    // Jos pelaaja löytyi poistetaan
    if (playerIndex !== null && typeof players[playerIndex] !== 'undefined') {
        Matter.Composite.remove(engine.world, players[playerIndex].ball);
        Matter.Composite.remove(engine.world, players[playerIndex].constraint);
        players.splice(playerIndex, 1);
        io.sockets.emit('u_ded_son', id);
    }
}

/*
Player-luokka
JavaScriptissä voidaan tehdä luokka funktiona,
joka palauttaa objektin / structin tapaisen muuttujan.
Tässä tapauksessa esim.
var uusiPelaaja = new Player(3132);
voitaisiin käyttää seuraavasti:
uusiPelaaja.ball, olisi Matter.js pallo
uusiPelaaja.constraint, olisi Matter.js Constraint
Matter.js Constraint on ikäänkuin viiva joka vetää esinettä (bodyB) johonkin pisteeseen (pointA)
Tässä tapauksessa pisteeseen jossa hiiri sijaitsee sillä hetkellä.
Constraint siis vetää palloa hiiren sijaintiin
*/
function Player(pid)
{
    this.spawnX = null;
    this.spawnY = null;
    this.pid = pid;
    this.color = null;
    this.name = "--";
    this.gamearea = null;
    this.lives = 3;
    this.initialize = function() {
        for (var i = 0; i < 8; i++) {
            if (gameAreas[i].pid == null) {
                gameAreas[i].pid = pid;
                this.gamearea = i;
                var tmpX = (gameAreas[i].leftX + gameAreas[i].rightX) / 2;

                if (tmpX == 772.5) {
                    tmpX = tmpX - 20;
                } else if (tmpX == 27.5) {
                    tmpX = tmpX + 20;
                }
                this.spawnX = tmpX;

                var tmpY = (gameAreas[i].leftY + gameAreas[i].rightY) / 2;

                if (tmpY == 772.5) {
                    tmpY = tmpY - 20;
                } else if (tmpY == 27.5) {
                    tmpY = tmpY + 20;
                }
                this.spawnY = tmpY;
                this.color = colors[i];
                break;
            }
        }
    };
    this.initialize();
    this.ball = Matter.Bodies.circle(this.spawnX, this.spawnY, 30, { frictionAir: 0 });
    this.constraint = Matter.Constraint.create({
        pointA: { x: this.spawnX, y: this.spawnY },
        bodyB: this.ball,
        length: 1
    });
}
