/**
 * Snake
 * Author: Ximin She
 * Some codes used to setup webGL and the gl-matrix.js comes from my previous project provided my CSC461 Faculty.
 * I used https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Creating_3D_objects_using_WebGL for help to draw cube
 * For transformation of the wall, it'll be much more complicated if we just move the cube.
 * Instead, I noticed there are methods used to popMatric and PushMatric used to move the cube to the origin, then transform it, then
 * move it to the correct location. https://stackoverflow.com/questions/23971752/understanding-glpushmatrix-and-glpopmatrix. From that, I learned I can use a origin to
 * store the matrix before I do any transformation.
 * I used the following link to learn about how to animate the snake by "sleep" https://stackoverflow.com/questions/1141302/is-there-a-sleep-function-in-javascript
 * I used the following link to learn about how to add sounds into my game https://www.w3schools.com/graphics/game_sound.asp
 * The music files come from https://soundimage.org/fantasywonder/,
 * https://freesound.org/people/InspectorJ/sounds/412068/,
 * https://offers.adobe.com/en/na/audition/offers/audition_dlc/AdobeAuditionDLCSFX.html?cq_ck=1407955238126&wcmmode=disabled,
 * All of them are free.
 */

var canvas;
var wall = [];
var mMatrix = mat4.create();
var pMatrix = mat4.create();
var vertexPositionAttribute;
var colorAttribute;
var indexAttribute;
var modelMatrixLoc;
var projectionMatrixLoc;

var snake = [];
var npsnake = [];
var snakeDirection;
var npsnakeDirection;
var direction;

var startTime = new Date().getTime();

var fruit;

var npChangeDirectionWait = 0;

var score1Element;
var score1 = 0;
var score2Element;
var score2 = 0;

var twoPlayer = false;
var backgroundMusic;
var eatMusic;
var crashMusic;

var collision = true;
var collisionElement;

var speed = 170;
var speedElement;


var defaultBackgroundColor = 0.6;
var backgroundColor = defaultBackgroundColor;

var smooth = false;
var maxSpeed = 340;
var stepFactor = 1;

var keyForOnePlayer;
var keyForTwoPlayer;


function main() {
  setupWebGL(); // set up the webGL environment
  setupShaders();
  addWallPoint();
  addFruit();
  initialsnake();
  initialNPsnake();
  addFruit();
  backgroundMusic = document.createElement("audio");
  backgroundMusic.src = "background.mp3";
  backgroundMusic.setAttribute("preload", "auto");
  backgroundMusic.setAttribute("controls", "loop");

  eatMusic = document.createElement("audio")
  eatMusic.src = "eat.mp3";
  eatMusic.setAttribute("preload", "auto");
  eatMusic.setAttribute("controls", "loop");

  crashMusic = document.createElement("audio")
  crashMusic.src = "crash.mp3";
  crashMusic.setAttribute("preload", "auto");
  crashMusic.setAttribute("controls", "loop");
  render();
}

function withComputer(){
  keyForTwoPlayer = 0;;
  backgroundMusic.play();
  twoPlayer = false;
  keyForOnePlayer = document.addEventListener('keydown', function(e) {
    if(e.key === 'a' || e.key === 'A' ){
      if(direction === 'up' || direction === 'down'){
        direction = "left";
        snakeDirection = [-1, 0, 0];
      }
    } else if (e.key === 'w' || e.key === 'W'){
      if(direction === 'left' || direction === 'right'){
        direction = "up";
        snakeDirection = [0, 1, 0];
      }
    } else if (e.key === 'd' || e.key === 'D' ){
      if(direction === 'up' || direction === 'down'){
        direction = "right";
        snakeDirection = [1, 0, 0];
      }
    } else if (e.key === 's' || e.key === 'S' ){
      if(direction === 'left' || direction === 'right'){
        direction = "down";
        snakeDirection = [0, -1, 0];
      }
    }
  });
  loop();
}

function withPlayer(){
  keyForOnePlayer = 0;
  backgroundMusic.play();
  twoPlayer = true;
  keyForTwoPlayer = document.addEventListener('keydown', function(e) {
    if(e.key === 'a' || e.key === 'A'){
      if(direction === 'up' || direction === 'down'){
        direction = "left";
        snakeDirection = [-1, 0, 0];
      }
    } else if (e.key === 'w' || e.key === 'W'){
      if(direction === 'left' || direction === 'right'){
        direction = "up";
        snakeDirection = [0, 1, 0];
      }
    } else if (e.key === 'd' || e.key === 'D'){
      if(direction === 'up' || direction === 'down'){
        direction = "right";
        snakeDirection = [1, 0, 0];
      }
    } else if (e.key === 's' || e.key === 'S'){
      if(direction === 'left' || direction === 'right'){
        direction = "down";
        snakeDirection = [0, -1, 0];
      }
    } else if (e.key === 'ArrowLeft'){

      if(npsnakeDirection[1] != 0) {
        npsnakeDirection = [-1, 0, 0];
      }
    } else if (e.key === 'ArrowRight'){
      if(npsnakeDirection[1] != 0) {
        npsnakeDirection = [1, 0, 0];
      }
    } else if (e.key === 'ArrowUp'){
      if(npsnakeDirection[0] != 0) {
        npsnakeDirection = [0, 1, 0];
      }
    } else if (e.key === 'ArrowDown'){
      if(npsnakeDirection[0] != 0) {
        npsnakeDirection = [0, -1, 0];
      }
    }

  });
  loop();
}

function loop(){
  requestAnimationFrame(loop);

  render();

  var now = new Date().getTime();
  var interval = now - startTime;
  if(interval >= maxSpeed - speed){

    stepForward();
    npStepForward();
    if(!twoPlayer){
      changeNpsnakeDirection();
    }
    startTime = now;
  }

  if(backgroundColor > defaultBackgroundColor){
    backgroundColor -= 0.10;
  }

  score1Element.innerHTML = score1;
  score2Element.innerHTML = score2;

}

function drawWall(){

  var positionBuffer = addPosition(0.25);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, positionBuffer.numComponents, gl.FLOAT, false, 0, 0);

  var colorsBuffer = addColor(0.2, 0.1, 0.4);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
  gl.vertexAttribPointer(colorAttribute, colorsBuffer.numComponents, gl.FLOAT, false, 0, 0);

  var indexBuffer = addIndex();

  for( var i in wall){

    var cube = wall[i];

    var origin = mat4.create();
    mat4.copy(origin, mMatrix);

    mMatrix = mat4.translate(mMatrix, mMatrix, [cube[0], cube[1], cube[2]]);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.uniformMatrix4fv(projectionMatrixLoc, false, pMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, mMatrix);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

    mMatrix = origin;

  }
}

function drawsnake(){

  var positionBuffer = addPosition(0.4);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, positionBuffer.numComponents, gl.FLOAT, false, 0, 0);

  var colorsBuffer = addColor(0.96, 0.89, 0.78);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
  gl.vertexAttribPointer(colorAttribute, colorsBuffer.numComponents, gl.FLOAT, false, 0, 0);

  var indexBuffer = addIndex();

  for( var i in snake){

    var cube = snake[i];

    var origin = mat4.create();

    mat4.copy(origin, mMatrix);

    mMatrix = mat4.translate(mMatrix, mMatrix, [cube[0], cube[1], cube[2]]);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, pMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, mMatrix);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

    mMatrix = origin;

  }

  colorsBuffer = addColor(1, 0.65, 0.62);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
  gl.vertexAttribPointer(colorAttribute, colorsBuffer.numComponents, gl.FLOAT, false, 0, 0);

  for( var i in npsnake){

    var cube = npsnake[i];

    var origin = mat4.create();

    mat4.copy(origin, mMatrix);

    mMatrix = mat4.translate(mMatrix, mMatrix, [cube[0], cube[1], cube[2]]);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, pMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, mMatrix);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

    mMatrix = origin;

  }
}

function drawFruit(){
  var positionBuffer = addPosition(0.4);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, positionBuffer.numComponents, gl.FLOAT, false, 0, 0);

  var colorsBuffer = addColor(0.96, 0.39, 0.09);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
  gl.vertexAttribPointer(colorAttribute, colorsBuffer.numComponents, gl.FLOAT, false, 0, 0);

  var indexBuffer = addIndex();

  mMatrix = mat4.translate(mMatrix, mMatrix, [fruit[0], fruit[1], fruit[2]]);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.uniformMatrix4fv(projectionMatrixLoc, false, pMatrix);
  gl.uniformMatrix4fv(modelMatrixLoc, false, mMatrix);

  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

function setupWebGL() {
    // Get the canvas and context
    canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    score1Element = document.getElementById("player1");
    score2Element = document.getElementById("player2");
    collisionElement = document.getElementById("collisionButton");
    speedElement = document.getElementById("speed");

    gl = canvas.getContext("webgl"); // get a webgl object from it

    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try

    catch(e) {
      console.log(e);
    } // end catch
}

function addWallPoint(){

  for(var i = -15; i <= 15; i++){
    wall.push([i, -15, 0]);
    wall.push([i, 15, 0]);
  }
  for(var j = -14; j <= 14; j++){
    wall.push([-15, j, 0]);
    wall.push([15, j, 0]);
  }

}

function addFruit(){

  var onSnake = false;
  while(!onSnake){
    onSnake = true;
    var xSign = Math.random() <= 0.5 ? true : false;
    var ySign = Math.random() <= 0.5 ? true : false;
    var xNum = Math.round(Math.random() * 14);
    var yNum = Math.round(Math.random() * 14);
    var x = xSign? 0 - xNum : xNum;
    var y = ySign? 0 - yNum : xNum;
    fruit = [x, y, 0];

    for(var i = 0; i < snake.length; i++){

      if(x === snake[i][0] && y === snake[i][1]){
        onSnake = false;
      }
    }

    for(var i = 0; i < npsnake.length; i++){
      if(x === npsnake[i][0] && y === npsnake[i][1]){
        onSnake = false;
      }
    }
  }

}

function initialsnake(){
  snake = [];
  var initialPostions = [[-2, -1, 0], [-1, -1, 0], [0, -1, 0], [1, -1, 0]];
  snakeDirection = [-1, 0, 0];
  direction = "left";

  for(var i in initialPostions){
    snake.push(initialPostions[i]);
  }

}

function initialNPsnake(){
  npsnake = [];
  var initialPostions = [[2, 1, 0], [1, 1, 0], [0, 1, 0], [-1, 1, 0]];
  npsnakeDirection = [1, 0, 0];

  for(var i in initialPostions){
    npsnake.push(initialPostions[i]);
  }

}

function addPosition(size){
  const pbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pbuffer);

  const positions = [
  // Front face
    -size, -size,  size,
    size, -size,  size,
    size,  size,  size,
    -size,  size,  size,

  // Back face
    -size, -size, -size,
    -size,  size, -size,
    size,  size, -size,
    size, -size, -size,

  // Top face
    -size,  size, -size,
    -size,  size,  size,
    size,  size,  size,
    size,  size, -size,

  // Bottom face
    -size, -size, -size,
    size, -size, -size,
    size, -size,  size,
    -size, -size,  size,

  // Right face
    size, -size, -size,
    size,  size, -size,
    size,  size,  size,
    size, -size,  size,

  // Left face
    -size, -size, -size,
    -size, -size,  size,
    -size,  size,  size,
    -size,  size, -size,
  ];

  pbuffer.numComponents = 3;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return pbuffer;
}

function addColor(r, g, b){

  const faceColors = [
    [r, g, b, 1.0],
    [r, g, b, 1.0],
    [r, g, b, 1.0],
    [r, g, b, 1.0],
    [r, g, b, 1.0],
    [r, g, b, 1.0],
  ];

  var colors = [];

  for (var j = 0; j < faceColors.length; ++j) {
    colors = colors.concat(faceColors[j], faceColors[j], faceColors[j], faceColors[j]);
  }
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  colorBuffer.numComponents = 4;
  return colorBuffer;

}

function stepForward(){
  var newPosition = [snake[0][0] + snakeDirection[0] * stepFactor, snake[0][1] + snakeDirection[1] * stepFactor, snake[0][2] + snakeDirection[2] * stepFactor];

  var eatItself = false;
  if(snake.length >= 5){
    for(var i = 0; i < snake.length; i++){
      if(newPosition[0] === snake[i][0] && newPosition[1] === snake[i][1]){
        eatItself = true;
      }
    }
  }

  var hitOther = false;
  for(var i = 0; i < npsnake.length; i++){
    if(newPosition[0] === npsnake[i][0] && newPosition[1] === npsnake[i][1]){
      hitOther = true;
      if(npsnake[0][0] == newPosition[0] && npsnake[0][1] == newPosition[1]){
        score2 = 0;
        initialNPsnake();
      }
    }
  }


  var hitWall = newPosition[0] < -14 || newPosition[1] < -14 || newPosition[0] > 14 || newPosition[1] > 14 ? true : false;

  var violate = hitWall || eatItself || hitOther;

  if(violate && collision){
    crashMusic.play();
    score1 = 0;
    backgroundColor = 1.0;
    initialsnake();
  } else {
    snake.unshift(newPosition);
    if(snake[0][0] === fruit[0] && snake[0][1] === fruit[1]){
      score1++;
      eatMusic.play();
      addFruit();
    } else {
      if(smooth){
        if((snake[0][0] === fruit[0] + 0.5 && snake[0][1] === fruit[1]) || (snake[0][0] === fruit[0] - 0.5 && snake[0][1] === fruit[1])|| (snake[0][0] === fruit[0] && snake[0][1] === fruit[1] + 0.5 ) || (snake[0][0] === fruit[0] && snake[0][1] === fruit[1] - 0.5)){
            score2++;
            eatMusic.play();
            addFruit();
        }else {
            snake.pop();
        }
      } else {
        snake.pop();
      }
    }
  }


}

function npStepForward(){
  var newPosition = [npsnake[0][0] + npsnakeDirection[0]  * stepFactor, npsnake[0][1] + npsnakeDirection[1]  * stepFactor, npsnake[0][2] + npsnakeDirection[2] * stepFactor];

  var eatItself = false;
  if(npsnake.length >= 5){
    for(var i = 0; i < npsnake.length; i++){
      if(newPosition[0] === npsnake[i][0] && newPosition[1] === npsnake[i][1]){
        eatItself = true;
      }
    }
  }

  var hitOther = false;
  for(var i = 0; i < snake.length; i++){
    if(newPosition[0] === snake[i][0] && newPosition[1] === snake[i][1]){
      hitOther = true;
      if(snake[0][0] == newPosition[0] && snake[0][1] == newPosition[1]){
        score1 = 0;
        initialsnake();
      }
    }
  }


  var hitWall = newPosition[0] < -14 || newPosition[1] < -14 || newPosition[0] > 14 || newPosition[1] > 14 ? true : false;

  var violate = hitWall || eatItself || hitOther;

  if(violate  && collision){
    crashMusic.play();
    score2 = 0;
    backgroundColor = 1.0;
    initialNPsnake();
  } else {
    npsnake.unshift(newPosition);
    if(npsnake[0][0] === fruit[0] && npsnake[0][1] === fruit[1]){
      score2++;
      eatMusic.play();
      addFruit();
    } else {
      if(smooth){
        if((npsnake[0][0] === fruit[0] + 0.5 && npsnake[0][1] === fruit[1]) || (npsnake[0][0] === fruit[0] - 0.5 && npsnake[0][1] === fruit[1])|| (npsnake[0][0] === fruit[0] && npsnake[0][1] === fruit[1] + 0.5 ) || (npsnake[0][0] === fruit[0] && npsnake[0][1] === fruit[1] - 0.5)){
            score2++;
            eatMusic.play();
            addFruit();
        }else {
            npsnake.pop();
        }
      } else {
        npsnake.pop();
      }
    }
  }
}

function changeNpsnakeDirection(){
  npChangeDirectionWait++;
  if(npChangeDirectionWait % 2 === 0){
    var dice = Math.random();
    if(npsnakeDirection[0] != 0){
      if(dice < 0.5){
        npsnakeDirection = [0, 1, 0];
      } else {
        npsnakeDirection = [0, -1, 0];
      }
    } else {
      if(dice < 0.5){
        npsnakeDirection = [1, 0, 0];
      } else {
        npsnakeDirection = [-1, 0, 0];
      }
    }
  }
}

function addIndex(){
  const iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);

  const indices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ];

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return iBuffer;
}

function setupShaders() {
  // define vertex shader in essl using es6 template strings
  var vShaderCode = `
        attribute vec3 aVertexPosition; // vertex position
        attribute vec4 aVertexColor;

        uniform mat4 umMatrix; // the model matrix
        uniform mat4 upvmMatrix; // the project view model matrix

        varying vec4 vColor;

        void main(void) {
            vColor = aVertexColor;
            gl_Position = upvmMatrix * umMatrix * vec4(aVertexPosition, 1.0);
        }
    `;

  // define fragment shader in essl using es6 template strings
  var fShaderCode = `
        precision mediump float; // set float to medium precision

        varying vec4 vColor;

        void main(void) {

          gl_FragColor = vColor;

        }
    `;

  try {
    var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
    gl.shaderSource(fShader, fShaderCode); // attach code to shader
    gl.compileShader(fShader); // compile the code for gpu execution

    var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
    gl.shaderSource(vShader, vShaderCode); // attach code to shader
    gl.compileShader(vShader); // compile the code for gpu execution

    if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
      // bad frag shader compile
      throw "error during fragment shader compile: " +
        gl.getShaderInfoLog(fShader);
      gl.deleteShader(fShader);
    } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
      // bad vertex shader compile
      throw "error during vertex shader compile: " +
        gl.getShaderInfoLog(vShader);
        gl.deleteShader(vShader);
    } else {
      // no compile errors
      var shaderProgram = gl.createProgram(); // create the single shader program
      gl.attachShader(shaderProgram, fShader); // put frag shader in program
      gl.attachShader(shaderProgram, vShader); // put vertex shader in program
      gl.linkProgram(shaderProgram); // link program into gl context

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        // bad program link
        throw "error during shader program linking: " +
          gl.getProgramInfoLog(shaderProgram);
      } else {
        // no shader program link errors
        gl.useProgram(shaderProgram); // activate shader program (frag and vert)

        vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(vertexPositionAttribute);
        colorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
        gl.enableVertexAttribArray(colorAttribute);
        projectionMatrixLoc = gl.getUniformLocation(shaderProgram, "upvmMatrix");
        modelMatrixLoc = gl.getUniformLocation(shaderProgram,"umMatrix");
      }

    }
  } catch (e) { // end try
    console.log(e);
  } // end catch
}

function render() {

    gl.clearColor(backgroundColor,  backgroundColor,  backgroundColor, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, 45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 1, 100);

    mat4.identity(mMatrix);

    mat4.translate(mMatrix, mMatrix, [0.0, 0.0, -40.0]);

    drawWall();
    drawsnake();
    drawFruit();
}

function collisionOrNot(){

  if(collision){
    collisionElement.innerHTML = "Collision Off"
    collision = false;
  } else {
    collisionElement.innerHTML = "Collision On"
    collision = true;
  }
}

function decelerate(){
  speed -= 15;
  if(speed <= 15){
    speed = 15;
    speedElement.innerHTML = "Speed: " + speed + " MPH (MIN)";
  } else {
    speedElement.innerHTML = "Speed: " + speed + " MPH";
  }
}

function accelerate(){
  speed += 15;
  if(speed >= 340){
    speed = 340;
    speedElement.innerHTML = "Speed: " + speed + " MPH (MAX)";
  } else {
    speedElement.innerHTML = "Speed: " + speed + " MPH";
  }

}

function smoothMove(){
  smooth = !smooth;
  if(smooth){
    speed += 100;
    stepFactor = 0.5;
    accelerate();
    SmoothButton.innerHTML = "Smooth Move: On";
  } else {
    speed -= 100;
    stepFactor = 1;
    decelerate();
    SmoothButton.innerHTML = "Smooth Move: Off";
  }
  main();
}
