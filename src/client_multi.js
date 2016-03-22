var socket = io();

var canvas = document.getElementById('canvas'),
ctx = canvas.getContext('2d');

// Piirtoalueen korkeus, leveys
var height = 800, width = 800;

// Hiiren sijainnin koordinaatit tallennettuna
var mouse = {
    x: 400,
    y: 400
};

// Pelipallo
var playBall = {
    x: 600,
    y: 600,
    radius: 20,
    color: "black"
};

// Pelaajan oma löyntipallo
var playerBall = {
    x: 600,
    y: 600,
    radius: 30,
    color: "red"
};

// Muut pelaajat taulukossa, tyhjä aluksi
var others = [];

function animate()
{
    /*
    Tyhjennetään ruutu
    */
    clear();
    /*
    Piirretään seinät
    */
    //Katto
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(width/3, 27.5);
    ctx.lineTo(width/3 * 2, 27.5);
    ctx.stroke();
    //Vasen yläkulma
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(width/3, 2);
    ctx.lineTo(2, height/3);
    ctx.stroke();
    //Vasen seinä
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(27.5, height/3);
    ctx.lineTo(27.5, height/3 * 2);
    ctx.stroke();
    //Vasen alakulma
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(2, height/3 * 2);
    ctx.lineTo(width/3, 798);
    ctx.stroke();    
    //Lattia
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(width/3, 772.5);
    ctx.lineTo(width/3 * 2, 772.5);
    ctx.stroke();
    //Oikea alakulma
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(width/3 * 2, 798);
    ctx.lineTo(798, height/3 * 2);
    ctx.stroke();
    //Oikea seinä
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(772.5, height/3 * 2);
    ctx.lineTo(772.5, height/3);
    ctx.stroke();
    //Oikea yläkulma
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(798, height/3);
    ctx.lineTo(width/3 * 2, 2);
    ctx.stroke();
    /*
    Piirretään pallo
    */
    ctx.beginPath();
    ctx.arc(playBall.x, playBall.y, playBall.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = playBall.color;
    ctx.fill();
    /*
    Piirretään löyntipallon sijainti clientillä
    */
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 30, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'green';
    ctx.fill();
    /*
    Piiretään löyntipallon sijainti serverillä
    */
    ctx.beginPath();
    ctx.arc(playerBall.x, playerBall.y, playerBall.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = playerBall.color;
    ctx.fill();
    /*
    Piiretään muiden pelaajien löyntipallot serverillä
    */
    var othersLen = others.length;
    for (var i = 0; i < othersLen; i++) {
        ctx.beginPath();
        ctx.arc(others[i].x, others[i].y, 30, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'cyan';
        ctx.fill();
    }

    // Kutsuu animate-funktiota uudelleen ruudun luontaisella päivitysnopeudella
    window.requestAnimationFrame(animate);
}

/*
Funktio joka tyhjentää piirtoalueen
*/
function clear()
{
    ctx.clearRect(0, 0, width, height);
}

/*
Funktio joka hakee hiiren paikan näytöllä
*/
function getMousePos(canvas, event)
{
    var rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX-rect.left)/(rect.right-rect.left)*canvas.width,
        y: (event.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height
    }
}

/*
Funcktio joka aloittaa clientin:
lisää eventlistenerit, aloittaa piirtämisen 
ja ilmoittaa olevansa valmis serverille
*/
function startClient()
{
    canvas.height = height;
    canvas.width = width;

    canvas.addEventListener("mousemove", function(event) {
        mouse = getMousePos(canvas, event);
        // Lähetetään hiiren sijainti serverille ja kerrotaan oma ID, 
        // niin serveri tietää kenen palloa liikuttaa
        socket.emit('client_update', { pid: socket.io.engine.id, pos: mouse });
    });

    animate();
}

/*
Socket.io, kun saa socketin nimellä 'update', päivittää pelipallon sijainnin
serveriltä tulevilla arvoilla. Tulee serveriltä objektina 'pos' jolla on
jäsenet x ja y
*/
socket.on('update', function(pos) {
    playBall.x = pos.x;
    playBall.y = pos.y;
});

/*
Socket.io, kun saa socketin nimellä 'update_players', päivittää oman ja vastustajien pallojen
sijainnit. Tulee serveriltä objektina 'players' jolla on jokaista pelaajaa kohtaan jäsen.
Esimerkiksi jos pelaaja, jonka ID on 'vWslDXkdwyKLFs' on pelissä, olisi players objektilla
jäsen vWslDXkdwyKLFs jota voisi käyttää seuraavasti: players.vWslDXkdwyKLFs
JavaScriptissä voi käyttää objektia myös seuraavasti: players[vWslDXkdwyKLFs].
Jokainen jäsen on itsessään myös objekti jolla on jäsenet x ja y.
Eli players.vWslDXkdwyKLFs.x ja players.vWslDXkdwyKLFs.y.

Jos helpottaa niin näin tältä players objekti näyttäisi tässä tapauksessa:

var players = {
    vWslDXkdwyKLFs: {
        x: 5,
        y: 10
    }
}
*/
socket.on('update_players', function(players) {
    // Tyhjennetään ensin muiden pelaajien taulukko
    others = [];
    // Käydään läpi kaikki 'players'-objektin jäsenet
    for (var property in players) {
        // Jos jäsen on olemassa
        if (players.hasOwnProperty(property)) {
            // Jos jäsen on sama kuin pelaajan oma ID
            if (property === socket.io.engine.id) {
                // Oma pallon sijainti päivitetään, players
                playerBall.x = players[socket.io.engine.id].x;
                playerBall.y = players[socket.io.engine.id].y;
            // Muutoin kyseessä vastustajan pallo
            } else {
                // Lisätään muiden pelaajien taulukon perälle
                others.push(players[property]);
            }
        }
    }
});

// Käynnistetään peli
startClient();
