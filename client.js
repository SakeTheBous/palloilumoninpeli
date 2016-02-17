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

var globalDirection = {
	x: 0,
	y: 0
};

var ball = {
	x: canvas.width / 2,
	y: canvas.height / 2
};

var boundaries = {
	sx: 0,
	sy: 0,
	ex: canvas.width,
	ey: canvas.height
};

var lastSpeedCheck = {
	x: 250,
	y: 250,
	timestamp: Date.now()
};

var markX = 0;
var markY = 0;

var currSpeed = 0;

canvas.addEventListener("mousemove", function(event) {
	mouse = getMousePos(canvas, event);
});

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

function friction()
{
	globalDirection.x = globalDirection.x * 0.99;
	globalDirection.y = globalDirection.y * 0.99;
}

function drawBall()
{
	clear();
	ctx.fillStyle = "black";
	ctx.rect(boundaries.sx, boundaries.sy, boundaries.ex - boundaries.sx, boundaries.ey - boundaries.sy);
	ctx.stroke(); 
	ctx.beginPath();
	ctx.arc(canvas.width / 2, canvas.height / 2, 300, 0, 2 * Math.PI, false);
	ctx.fillStyle = "none";
	ctx.stroke();
	ctx.strokeStyle = 'none';
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, ballRadius, 0, 2 * Math.PI, false);
	ctx.fillStyle = ballColor;
	ctx.fill();
	ctx.beginPath();
	ctx.arc(mouse.x, mouse.y, ballRadius * 2, 0, 2 * Math.PI, false);
	ctx.fillStyle = 'green';
	ctx.fill();
	ctx.fillStyle = "green";
	ctx.fillRect(markX, markY, 1, 1);

	var hitX = ball.x - mouse.x + ballRadius,
	hitY = ball.y - mouse.y + ballRadius;

	var distance = calcDist(ball.x, ball.y, mouse.x, mouse.y);
	var distFromCenter = calcDist(canvas.width / 2, canvas.height / 2, ball.x, ball.y);

	if (distance <= ballRadius * 3) {
		moveBall(hitX, hitY, true);
		globalDirection.x = hitX;
		globalDirection.y = hitY;
	} else if (distFromCenter >= 300 - ballRadius) {
		for (var i=0; i<360; i++) {
			if (ball.x + ballRadius >= 300 && ball.y + ballRadius >= 300) {
				markX = ball.x + ballRadius;
				markY = ball.y + ballRadius;
			} else if (ball.x - ballRadius >= 300 && ball.y - ballRadius >= 300) {
				markX = ball.x - ballRadius;
				markY = ball.y - ballRadius;
			}
		}
		globalDirection.x = globalDirection.x * (-1);
		globalDirection.y = globalDirection.y * (-1);
		moveBall(globalDirection.x, globalDirection.y);
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
	window.requestAnimationFrame(drawBall);
}

function clear()
{
	ctx.clearRect(0, 0, width, height);
}

function calcDist(x1, y1, x2, y2)
{
	var dx = x1 - x2,
	dy = y1 - y2;

	return Math.sqrt(dx*dx + dy*dy);
}

function getMousePos(canvas, event)
{
	var rect = canvas.getBoundingClientRect();
	return {
		x: (event.clientX-rect.left)/(rect.right-rect.left)*canvas.width,
		y: (event.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height
	}
}

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