var canvas = document.getElementById("canvas");
canvas.height = $(window).height();
canvas.width = $(window).width();
var width = canvas.width;
var height = canvas.height;
var ctx = canvas.getContext("2d");
var bgColor = "#FFFFFF";
var ballColor = "#000000";
var ballRadius = 20;
var mouse = {
	x: canvas.width / 2,
	y: canvas.height / 2
};

/*
Suunta x,y
*/

var globalDirection = {
	x: 0,
	y: 0
};

/*
Pallon x,y koordinaatit
*/

var ball = {
	x: canvas.width / 2,
	y: canvas.height / 2
};

/*
Vanhat pelialueen rajat
*/

var boundaries = {
	sx: 100,
	sy: 100,
	ex: canvas.width - 100,
	ey: canvas.height - 100
};

/*
Osumakohta x,y koordinaatit
*/

var markX = 0;
var markY = 0;

/*
Pallon nopeus
*/

var currSpeed = 0;

canvas.addEventListener("mousemove", function(event) {
	mouse = getMousePos(canvas, event);
});

/*
Funktio joka liikuttaa palloa
*/

function moveBall(hitX, hitY, mousehit)
{
	if (mousehit) {
		ball.x = ball.x + ((1 + currSpeed) * (0.5 * hitX));
		ball.y = ball.y + ((1 + currSpeed) * (0.5 * hitY));
	} else {
		ball.x = ball.x + hitX;
		ball.y = ball.y + hitY;
	}
	friction();
}

/*
Funktio hidastaa nopeutta
*/

function friction()
{
	globalDirection.x = globalDirection.x * 0.99;
	globalDirection.y = globalDirection.y * 0.99;
}

/*
Koko pelin logiikka
*/

function drawBall()
{
	/*
	Tyhjennetään ruutu
	*/
	clear();
	/*
	Piirretään musta kehä
	*/
	ctx.fillStyle = "black";
	ctx.rect(boundaries.sx, boundaries.sy, boundaries.ex - boundaries.sx, boundaries.ey - boundaries.sy);
	ctx.stroke();
	/*
	Piirretään pallo
	*/
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, ballRadius, 0, 2 * Math.PI, false);
	ctx.fillStyle = ballColor;
	ctx.fill();
	/*
	Piirretään löyntipallo
	*/
	ctx.beginPath();
	ctx.arc(mouse.x, mouse.y, ballRadius * 2, 0, 2 * Math.PI, false);
	ctx.fillStyle = 'green';
	ctx.fill();
	/*
	Yritys piirtää osumakohta
	*/
	ctx.fillStyle = "green";
	ctx.fillRect(markX, markY, 1, 1);

	/*
	Tarkastetaan missä löyntipallo osuu palloon
	Pallon X koordinaatti - hiiren X koordinaati + pallon säde
	Pallon Y koordinaatti - hiiren Y koordinaati + pallon säde
	*/
	var hitX = ball.x - mouse.x + ballRadius,
	hitY = ball.y - mouse.y + ballRadius;

	/*
	Lasketaan etäisyys pallon ja hiiren välillä
	*/
	var distance = calcDist(ball.x, ball.y, mouse.x, mouse.y);

	/*
	Osuuko löyntipalloon (löyntipallo säde = 2x pallon säde)
	*/
	if (distance <= ballRadius * 3) {
		/*
		Pallo osui löyntipalloon
		*/
		moveBall(hitX, hitY, true);
		globalDirection.x = hitX;
		globalDirection.y = hitY;
	} else if (((ball.x - ballRadius) <= boundaries.sx && (ball.y - ballRadius) <= boundaries.sy) || 
			((ball.x + ballRadius) >= boundaries.ex && (ball.y - ballRadius) <= boundaries.sy) || 
			((ball.x - ballRadius) <= boundaries.sx && (ball.y + ballRadius) >= boundaries.ey) ||
			((ball.x + ballRadius) >= boundaries.ex && (ball.y + ballRadius) >= boundaries.ey)) {
		globalDirection.x = globalDirection.x * (-1);
		globalDirection.y = globalDirection.y * (-1);
		moveBall(globalDirection.x, globalDirection.y);
	} else if ((ball.x - ballRadius) <= boundaries.sx || (ball.x + ballRadius) >= boundaries.ex) {
		globalDirection.x = globalDirection.x * (-1);
		moveBall(globalDirection.x, globalDirection.y);
	} else if ((ball.y - ballRadius) <= boundaries.sy || (ball.y + ballRadius) >= boundaries.ey) {
		globalDirection.y = globalDirection.y * (-1);
		moveBall(globalDirection.x, globalDirection.y);
	} else {
		moveBall(globalDirection.x, globalDirection.y);
	}

	/*
	Kutsuu drawBall-funktiota aina näytön päivittyessä
	*/
	window.requestAnimationFrame(drawBall);
}

/*
Funktio joka tyhjentää näytön
*/

function clear()
{
	ctx.clearRect(0, 0, width, height);
}

/*
Funktio joka laskee etäisyyden kahden pisteen välillä
*/

function calcDist(x1, y1, x2, y2)
{
	var dx = x1 - x2,
	dy = y1 - y2;

	return Math.sqrt(dx*dx + dy*dy);
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
Funktio joka käynnistää pelin
*/

function init()
{
	drawBall();
	$('#canvas').cursometer({
        onUpdateSpeed: function(speed) {
            currSpeed = speed;
        },
        updateSpeedRate: 20
	});
}

init();