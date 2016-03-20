var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies;

// create a Matter.js engine
var engine = Engine.create({
	render: {
		element: document.body,
		options: {
    		width: 1600,
        	height: 1000,
        	background: '#fafafa',
        	wireframeBackground: '#222',
        	hasBounds: false,
        	enabled: true,
        	wireframes: true,
        	showSleeping: true,
        	showDebug: false,
        	showBroadphase: false,
        	showBounds: false,
        	showVelocity: false,
        	showCollisions: false,
        	showAxes: false,
        	showPositions: false,
        	showAngleIndicator: false,
        	showIds: false,
        	showShadows: false
		}
	}
});

var playBall = Bodies.circle(400, 200, 20, {  frictionAir: 0, render: { fillStyle: '#3498DB', opacity: 0.5 } });

var vino = Bodies.rectangle(800, 500, 600, 60, { isStatic: true, angle: -Math.PI * 0.04 });
var floor = Bodies.rectangle(800, 1000, 1600, 60, { isStatic: true });
var wallLeft = Bodies.rectangle(0, 500, 60, 1200, { isStatic: true });
var wallRight = Bodies.rectangle(1600, 500, 60, 1200, { isStatic: true });
var roof = Bodies.rectangle(800, 0, 1600, 60, { isStatic: true });
wallLeft.restitution = 0.99;
wallRight.restitution = 0.99;
floor.restitution = 0.99;
roof.restitution = 0.99;

// Mouse
var mouseConstraint = Matter.MouseConstraint.create(engine);
engine.world.gravity.x = 0;
engine.world.gravity.y = 0;
engine.world.friction = 0;
engine.world.bounds.max.x = 1000;
engine.world.bounds.max.y = 1000;
World.add(engine.world, mouseConstraint);

// add all of the bodies to the world
World.add(engine.world, [playBall, wallLeft, wallRight, roof, floor]);

// run the engine
Engine.run(engine);