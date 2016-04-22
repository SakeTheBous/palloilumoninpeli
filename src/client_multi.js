var socket = io();

var canvas = document.getElementById('canvas'),
ctx = canvas.getContext('2d');

// Piirtoalueen korkeus, leveys
var height = 800, width = 800;

var gameover = false;

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
    color: "red",
    name: "--"
};

// Muut pelaajat taulukossa, tyhjä aluksi
var others = [];

// Pelialueet client puolella
var gameAreas = [];

function animate()
{
    /*
    Tyhjennetään ruutu
    */
    clear();

    var gameAreasLen = gameAreas.length;
    for (var i = 0; i < gameAreasLen; i++) {
        drawAreas(gameAreas[i]);
    }

    /*
    Piirretään seinät
    */
    //Katto
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(width/3 - 24, 27.5);
    ctx.lineTo(width/3 * 2 + 24, 27.5);
    ctx.strokeStyle = "black";
    ctx.stroke();
    //Vasen yläkulma
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(width/3 - 24, 27.5);
    ctx.lineTo(27.5, height/3 - 24);
    ctx.strokeStyle = "black";
    ctx.stroke();
    //Vasen seinä
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(27.5, height/3 - 24);
    ctx.lineTo(27.5, height/3 * 2 + 24);
    ctx.strokeStyle = "black";
    ctx.stroke();
    //Vasen alakulma
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(27.5, height/3 * 2 + 24);
    ctx.strokeStyle = "black";
    ctx.lineTo(width/3 - 24, 772.5);
    ctx.stroke();    
    //Lattia
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(width/3 - 24, 772.5);
    ctx.lineTo(width/3 * 2 + 24, 772.5);
    ctx.strokeStyle = "black";
    ctx.stroke();
    //Oikea alakulma
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(width/3 * 2 + 24, 772.5);
    ctx.lineTo(772.5, height/3 * 2 + 24);
    ctx.strokeStyle = "black";
    ctx.stroke();
    //Oikea seinä
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(772.5, height/3 * 2 +24);
    ctx.strokeStyle = "black";
    ctx.lineTo(772.5, height/3 - 24);
    ctx.stroke();
    //Oikea yläkulma
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(772.5, height/3 - 24);
    ctx.lineTo(width/3 * 2 + 24, 27.5);
    ctx.strokeStyle = "black";
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
    /*ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 30, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'green';
    ctx.fill();*/
    /*
    Piiretään löyntipallon sijainti serverillä
    */
    ctx.beginPath();
    ctx.arc(playerBall.x, playerBall.y, playerBall.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = playerBall.color;
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '15pt Open Sans';
    ctx.fillText(playerBall.name, playerBall.x - 13, playerBall.y + 7.5);
    /*
    Piiretään muiden pelaajien löyntipallot serverillä
    */

    var othersLen = others.length;
    for (var i = 0; i < othersLen; i++) {
        ctx.beginPath();
        ctx.arc(others[i].pos.x, others[i].pos.y, 30, 0, 2 * Math.PI, false);
        ctx.fillStyle = others[i].color;
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '15pt Open Sans';
        ctx.fillText(others[i].name, others[i].pos.x - 13, others[i].pos.y + 7.5);
    }

    // Kutsuu animate-funktiota uudelleen ruudun luontaisella päivitysnopeudella
    if (!gameover) {
        window.requestAnimationFrame(animate);
    } else {
        socket.emit('death');
        socket.emit('rejoin');
        login();
    }
}

/*
Funktio joka tyhjentää piirtoalueen
*/
function clear()
{
    ctx.clearRect(0, 0, width, height);
}

/*
Funktio joka piirtää pelialueet
*/
function drawAreas(area)
{
    // Vasen reuna
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.moveTo(area.center.x, area.center.y);
    ctx.lineTo(area.leftX, area.leftY);
    ctx.strokeStyle = "#999999";
    ctx.stroke();
    // Oikea reuna
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.moveTo(area.center.x, area.center.y);
    ctx.lineTo(area.rightX, area.rightY);
    ctx.strokeStyle = "#999999";
    ctx.stroke();
}

/*
Funktio joka laskee onko piste kolmion sisällä
*/

function isInTriangle (px, py, ax, ay, bx, by, cx, cy) {
    //credit: http://www.blackpawn.com/texts/pointinpoly/default.html

    var v0 = [cx-ax, cy-ay];
    var v1 = [bx-ax, by-ay];
    var v2 = [px-ax, py-ay];

    var dot00 = (v0[0] * v0[0]) + (v0[1] * v0[1]);
    var dot01 = (v0[0] * v1[0]) + (v0[1] * v1[1]);
    var dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
    var dot11 = (v1[0] * v1[0]) + (v1[1] * v1[1]);
    var dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);

    var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

    var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return ((u >= 0) && (v >= 0) && (u + v < 1));
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
Funktio joka kysyy käyttäjän nimen ja
lähettää sen serverille
*/

function login()
{
    var loginElement = document.createElement("div");
    var loginText = document.createElement("span");
    var loginInput = document.createElement("input");
    var loginButton = document.createElement("button");
    loginInput.type = "text";
    loginElement.className = 'login';
    loginText.innerHTML = 'Anna nimikirjaimesi : ';
    loginButton.innerHTML = 'Pelaa';
    loginElement.appendChild(loginText);
    loginElement.appendChild(loginInput);
    loginElement.appendChild(loginButton);
    loginButton.addEventListener('click', btnEvent);
    document.body.appendChild(loginElement);

    function btnEvent()
    {
        var name = loginInput.value.toUpperCase().substr(0, 2);
        startClient(name);
        loginButton.removeEventListener('click', btnEvent, false);
        loginElement.parentNode.removeChild(loginElement);
    }
}

/*
Funktio joka aloittaa clientin:
lisää eventlistenerit, aloittaa piirtämisen 
ja ilmoittaa olevansa valmis serverille
*/
function startClient(name)
{
    canvas.height = height;
    canvas.width = width;

    // Päivitetään gameover muttujaa
    gameover = false;

    canvas.addEventListener("mousemove", function(event) {
        mouse = getMousePos(canvas, event);
        // Lähetetään hiiren sijainti serverille ja kerrotaan oma ID, 
        // niin serveri tietää kenen palloa liikuttaa
        if (isInTriangle(
            mouse.x, 
            mouse.y, 
            gameAreas[playerBall.area].leftX, 
            gameAreas[playerBall.area].leftY, 
            gameAreas[playerBall.area].rightX, 
            gameAreas[playerBall.area].rightY, 
            gameAreas[playerBall.area].center.x, 
            gameAreas[playerBall.area].center.y)) 
        {
            socket.emit('client_update', { pid: socket.io.engine.id, name: name, pos: mouse });
        }
    });

    canvas.addEventListener("touchmove", function(event) {
        mouse = getMousePos(canvas, event);
        if (isInTriangle(
            mouse.x, 
            mouse.y, 
            gameAreas[playerBall.area].leftX, 
            gameAreas[playerBall.area].leftY, 
            gameAreas[playerBall.area].rightX, 
            gameAreas[playerBall.area].rightY, 
            gameAreas[playerBall.area].center.x, 
            gameAreas[playerBall.area].center.y)) 
        {
            socket.emit('client_update', { pid: socket.io.engine.id, name: name, pos: mouse });
        }
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

socket.on('u_ded_son', function(id) {
    if (id === socket.io.engine.id) {
        gameover = true;
    }
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
    console.log(socket.io.engine.id);
    // Tyhjennetään ensin muiden pelaajien taulukko
    others = [];
    // Käydään läpi kaikki 'players'-objektin jäsenet
    for (var property in players) {
        // Jos jäsen on olemassa
        if (players.hasOwnProperty(property)) {
            // Jos jäsen on sama kuin pelaajan oma ID
            if (property === socket.io.engine.id) {
                // Oma pallon sijainti päivitetään, players
                playerBall.x = players[socket.io.engine.id].pos.x;
                playerBall.y = players[socket.io.engine.id].pos.y;
                playerBall.color = players[socket.io.engine.id].color;
                playerBall.name = players[socket.io.engine.id].name;
                playerBall.area = players[socket.io.engine.id].area;
            // Muutoin kyseessä vastustajan pallo
            } else {
                // Lisätään muiden pelaajien taulukon perälle
                others.push(players[property]);
            }
        }
    }
});

socket.on('update_areas', function(areas) {
    gameAreas = areas;
});

// Käynnistetään peli
login();
