// Images
const pc = new Image();
pc.src = "images/pc.png";
const pc_centerCoords = {
  x: 33, // coords of center of main hexagon from Affinity Designer
  y: 55
}


// Get refs to HTML elements
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const pauseBtn = document.getElementById('pauseBtn');


// BG variables
const lineSpacing = 100;
const gridCount = 6;
const xMargin = 30;
let bgTranslate = 0;
const gravity = 9.8/10;

const cvsSize = lineSpacing*gridCount + 2*xMargin;

let nodeList = [
  [
    lineSpacing*2,
    [xMargin, cvsSize/2]
  ],
  [
    lineSpacing*4,
    [xMargin, cvsSize/2]
  ]
];

// Player Character Variables
let pcX = cvsSize*0.5;
let pcY = cvsSize*0.25; // pcY will be snapped to the nearest node at runtime
let charDirection;
let hitTolerance = 10; // How close in pixels to a node counts as a hit

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

  ctx.strokeStyle = "red";
  for (let i=0; i<nodeList.length; i++) {
    let y = nodeList[i][0];
    let xVals = nodeList[i][1];

    for (let j=0; j<xVals.length; j++) {
      ctx.beginPath();
      ctx.arc(xVals[j], y, 10, 0, 2 * Math.PI);
      ctx.stroke();

    }
    // Update y position for next frame after drawing node
    nodeList[i][0] = y - gravity;

  }
  ctx.strokeStyle = "black";
}


/*--------------------------------------------------------------------------------*/


function drawBG() {

  drawGrid();
  drawNodes();

}


/*--------------------------------------------------------------------------------*/

function playerOnNode() {
  // Figure out if player is on node and return the node they're on
  // Use hitTolerance variable to allow wiggle room
  //Math.hypot(x2-x1, y2-y1)
}


/*--------------------------------------------------------------------------------*/


function drawPC() {
  ctx.save();

  const rad = 2*Math.PI / 8; // 45 degrees
  let rot = 0;

  // Calculate PC velocity & rotation
  if (charDirection === directions.right) {
    pcX = Math.min(pcX + gravity, cvsSize-xMargin);
    rot = -rad;
  } else if ( charDirection === directions.left) {
    pcX = Math.max(pcX - gravity, xMargin);
    rot = rad
  }

  // Apply transforms based on velocity, rotation, and pixel offset of image center
  ctx.translate(pcX, pcY);
  ctx.rotate(rot);
  ctx.translate(-pc_centerCoords.x, -pc_centerCoords.y);

  // Draw PC Image
  ctx.drawImage(pc,0,0);

  ctx.restore();
}


/*--------------------------------------------------------------------------------*/


function draw(){
  if (isPaused) { return; }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBG();
  drawPC();

  //bgTranslate += gravity;
  console.log(pcX);
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


// Set canvas scale
canvas.width = cvsSize;
canvas.height = cvsSize;

// Set player starting attributes
pcY = Math.ceil(pcY/lineSpacing)*lineSpacing;
charDirection = directions.left;

// Toggle pause when button clicked
pauseBtn.addEventListener("click", function() {
  isPaused = isPaused ? false : true;
  draw();
  console.log("isPaused: " + isPaused);
});

// Add Player Controls
document.addEventListener("keypress", e => moveChar(e));

draw();
