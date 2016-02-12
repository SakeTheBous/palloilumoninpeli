var canvas = document.getElementById("canvas");
canvas.height = $(window).height();
canvas.width = $(window).width();
var width = canvas.width;
var height = canvas.height;
var ctx = canvas.getContext("2d");
var bgColor = "#FFFFFF";
var ballColor = "#000000";
var ballRadius = 10;
var mouse = {
	x: canvas.width / 2,
	y: canvas.height / 2
};

var globalDirection = {
	x: 0,
	y: 0
};

var ball = {
	x: 450,
	y: 300
};

var boundaries = {
	sx: 300,
	sy: 150,
	ex: 600,
	ey: 450
};

canvas.addEventListener("mousemove", function(event){
	mouse = getMousePos(canvas, event);
});

drawBall();

function moveBall(hitX, hitY)
{
	ball.x = ball.x + hitX;
	ball.y = ball.y + hitY;
}

function drawBall()
{
	clear();
	ctx.fillStyle = "black";
	ctx.rect(boundaries.sx, boundaries.sy, boundaries.ex - boundaries.sx, boundaries.ey - boundaries.sy);
	ctx.stroke(); 
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, ballRadius, 0, 2 * Math.PI, false);
	ctx.fillStyle = ballColor;
	ctx.fill();

	var hitX = ball.x - mouse.x,
	hitY = ball.y - mouse.y,
	direction = 1;
	if (Math.abs(hitX) < ballRadius && Math.abs(hitY) < ballRadius)	{
		moveBall(hitX, hitY);
		globalDirection.x = hitX;
		globalDirection.y = hitY;
	} else if (((ball.x - ballRadius) <= boundaries.sx && (ball.y - ballRadius) <= boundaries.sy) || 
			((ball.x + ballRadius) >= boundaries.ex && (ball.y - ballRadius) <= boundaries.sy) || 
			((ball.x - ballRadius) <= boundaries.sx && (ball.y + ballRadius) >= boundaries.ey) ||
			((ball.x + ballRadius) >= boundaries.ex && (ball.y + ballRadius) >= boundaries.ey)) {
		globalDirection.x = globalDirection.x * (-1);
		globalDirection.y = globalDirection.y * (-1);
		moveBall(globalDirection.x, globalDirection.y);
	} else if ((ball.x - ballRadius) <= 300 || (ball.x + ballRadius) >= 600) {
		globalDirection.x = globalDirection.x * (-1);
		moveBall(globalDirection.x, globalDirection.y);
	} else if ((ball.y - ballRadius) <= 150 || (ball.y + ballRadius) >= 450) {
		globalDirection.y = globalDirection.y * (-1);
		moveBall(globalDirection.x, globalDirection.y);
	} else {
		moveBall(globalDirection.x, globalDirection.y);
	}
	window.requestAnimationFrame(drawBall);
}

function clear()
{
	ctx.fillStyle = bgColor;
	ctx.fillRect(0, 0, width, height);
}

function getMousePos(canvas, event)
{
	var rect = canvas.getBoundingClientRect();
	return {
		x: (event.clientX-rect.left)/(rect.right-rect.left)*canvas.width,
		y: (event.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height
	}
}
