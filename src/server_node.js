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
        console.log('Pelaaja poistui pelista, ID : ' + id);
        // Otetaan pelaajat-taulukon pituus, niin sitä ei tarvitse for-lauseessa
        // laskea kokoajan uudelleen
        var playersLen = players.length;

        // Käydään läpi kaikki pelaajat players-taulukosta ja mikäli ID vastaa
        // WebSocketin sulkeneen pelaajan ID:tä, poistetaan pelaaja taulukosta
        for (var i = 0; i < playersLen; i++) {
        	if (players[i].pid === id) {
        		players.splice(i, 1);
        		break;
        	}
        }
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
    		}
    	}
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

// Lisätään esineet maailmaan
Matter.World.add(engine.world, [playBall, floor, wallLeft, wallRight, roof]);

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
			io.sockets.emit('update', playBall.position);
			for (var i=0; i < playersAmount; i++) {
				// Jos indexillä oleva pelaaja on olemassa, tässä siitä syystä että jos pelaaja
				// poistetaan samalla kun tämä loop on käynnissä, saattaa tulla index undefined error
				// jos pelaaja on ehditty poistamaan
				if (typeof players[i] !== 'undefined') {
					// Lisätään pelaajan sijainti tiedot playersData objektiin
					playersData[players[i].pid] = players[i].ball.position;
				}
			}

			// Lähetetään playersData kaikille WebSocket-yhteyksille
			io.sockets.emit('update_players', playersData);
		}, 10);
	} else if (quit) {
		// Pausetetaan peli
		console.log("----- Pausetetaan peli -----");
		gameStarted = false;
		// Suljetaan gameLoop, joka tehtiin setIntervalilla, clearInterval lopettaa sen
		clearInterval(gameLoop);
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
	this.pid = pid;
	this.ball = Matter.Bodies.circle(400, 400, 30, { frictionAir: 0 });
	this.constraint = Matter.Constraint.create({
		pointA: { x: 500, y: 400 },
		bodyB: this.ball,
		length: 1
	});
}