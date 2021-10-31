// Images
const pc = new Image();
pc.src = "images/pc_v01.png";


// Get refs to HTML elements
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const pauseBtn = document.getElementById('pauseBtn');


// BG variables
const lineSpacing = 100;
const gridCount = 6;
const xMargin = 30;
let bgTranslate = 0;
const gravity = 9.8/10/2;

const cvsSize = lineSpacing*gridCount + 2*xMargin;

// Player Character Variables
let pcX = cvsSize*0.5;
let pcY = cvsSize*0.25;
let charDirection;

// Other variables
let isPaused = false;
const directions = {
  left: "LEFT",
  right: "RIGHT",
  none: "NONE"
};


/*--------------------------------------------------------------------------------*/


function drawLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}


/*--------------------------------------------------------------------------------*/


function drawGrid() {
  ctx.translate(xMargin, -bgTranslate);

  for (let i=0; i<gridCount; i++) {
    for (let j=0; j<1+cvsSize/lineSpacing; j++) {
      drawLine(i*lineSpacing, j*lineSpacing, (i+1)*lineSpacing, (j+1)*lineSpacing);
      drawLine((i+1)*lineSpacing, j*lineSpacing, i*lineSpacing, (j+1)*lineSpacing);
    }
  }
  ctx.translate(-xMargin, bgTranslate);

  bgTranslate = (bgTranslate + gravity) % lineSpacing;
}


/*--------------------------------------------------------------------------------*/

function drawNodes() {
  //This is where BG nodes should be drawn
}


/*--------------------------------------------------------------------------------*/


function drawBG() {

  drawGrid();
  drawNodes();

}


/*--------------------------------------------------------------------------------*/


function draw(){
  if (isPaused) { return; }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBG();

  if (charDirection === directions.right) {
    pcX = pcX + gravity*2;
  } else if ( charDirection === directions.left) {
    pcX = pcX - gravity*2;
  }
  ctx.drawImage(pc,pcX, pcY);

  bgTranslate += gravity;

    requestAnimationFrame(draw);
}


/*--------------------------------------------------------------------------------*/


function moveChar(e) {
  console.log(e.keyCode);
  switch(e.keyCode) {
    // Thought this was 37 or 65
    case 97:
      charDirection = directions.left;
      break;

    // THought this was 39 or 68
    case 100:
      charDirection = directions.right;
      break;

    default:
      charDirection = directions.none;
      console.log("unknown key pressed");
  }
  console.log(charDirection);

}


/*--------------------------------------------------------------------------------*/


canvas.width = cvsSize;
canvas.height = cvsSize;

charDirection = directions.none;

// Toggle pause when button clicked
pauseBtn.addEventListener("click", function() {
  isPaused = isPaused ? false : true;
  draw();
  console.log("isPaused: " + isPaused);
});

// Add Player Controls
document.addEventListener("keypress", e => moveChar(e));

draw();
