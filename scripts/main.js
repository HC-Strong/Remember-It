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
const scoreDisplay = document.getElementById('score');


// BG variables
const lineSpacing = 100;
const gridCount = 6;
const xMargin = 30;
let bgTranslate = 0;
let prevBgTranslate = 0;
const gravity = 9.8/10;
const activeRowId = 5;
let activeRowY;

const cvsSize = lineSpacing*gridCount + 2*xMargin;

// Row layouts will be generated at runtime from rowLayoutSpecs
let rowLayout = {};

// Empty array to hold node list
let nodeList = [[]];
let nextRowIsA = false;

// node types
const nodeType = {
  BLUE: {
    COLOR: "blue",
    SCORE: 5
  },
  RED: {
    COLOR: "red",
    SCORE: 10
  },
  BLACK: {
    COLOR: "black",
    SCORE: 0
  }
};

const rowLayoutSpecs = {
  a : {
    start: xMargin,
    count: gridCount + 1
  },
  b: {
   start: xMargin + lineSpacing/2,
   count: gridCount
 }
};




// Player Character Variables
let pcX = cvsSize*0.5;
let pcY = cvsSize*0.25; // pcY will be snapped to the nearest node at runtime
let charDirection;
let hitTolerance = 1; // How close in pixels to a node counts as a hit
let nextDirection;

// Other variables
let isPaused = false;
let score = 0;
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


/**
* Returns a random value from an enum. Used to get random node types.
*/
function randEnumValue(enumeration) {
  const values = Object.keys(enumeration);
  const enumKey = values[Math.floor(Math.random() * values.length)];
  return enumeration[enumKey];
}


/*--------------------------------------------------------------------------------*/


/**
* Generates an array of nodes with length determined by the nextRowIsA global var
* Nodes are randomly copied from one of the available node types template objects
*/
function newNodeRow() {
  const layoutSpec = nextRowIsA ? rowLayoutSpecs.a : rowLayoutSpecs.b;

  let nodeRow = [];

  for (let i=0; i<layoutSpec.count; i++) {
    const node = {...randEnumValue(nodeType)}; /// Make new copy of nodeType template object
    node.X_COORD = (layoutSpec.start + i*lineSpacing);

    nodeRow.push(node);
  }
  nextRowIsA = !nextRowIsA;
  return nodeRow;
}


/*--------------------------------------------------------------------------------*/


/**
* Checks if bg has scrolled enough to need to update Nodes
* If so, deletes top row and adds new node row to end of nodeList array
*/
function manageNodes() {

  // Check if bgTranslate has crossed the halfway point OR wrapped back to zero
  let updateRows = (bgTranslate < prevBgTranslate)
      || (bgTranslate >= lineSpacing/2 && prevBgTranslate < lineSpacing/2);

  if (updateRows) {
    //console.log("Node Change");
    nodeList.shift();
    nodeList.push(newNodeRow());
  }
  prevBgTranslate = bgTranslate;
}


/*--------------------------------------------------------------------------------*/


function drawNodes() {

  manageNodes();

  for (let i=0; i<nodeList.length; i++) {

    // nextRowIsA toggles as the offset needs to change size
    let y = i*lineSpacing/2 - bgTranslate + nextRowIsA*lineSpacing/2;

    // Set stroke thickness and activeRowY if current row is active row
    if (i==activeRowId) {
      ctx.lineWidth = 10;
      activeRowY = y;
    } else {
      ctx.lineWidth = 1;
    }

    let row = nodeList[i];

    for (let j=0; j<row.length; j++) {
      let curNode = row[j];
      ctx.fillStyle = ctx.strokeStyle = curNode.COLOR;
      ctx.beginPath();
      ctx.arc(curNode.X_COORD, y, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.strokeStyle = "black";
}


/*--------------------------------------------------------------------------------*/


function drawBG() {
  drawGrid();
  drawNodes();
}


/*--------------------------------------------------------------------------------*/


/*
* Figure out if player is on node and return the node they're on
* Use hitTolerance variable to allow wiggle room
*/
function playerOnNode() {

  // Check if active row's y position has been hit or passed. Return if not
  if(pcY < (activeRowY-hitTolerance) ) { return; }

  // Check if active row layout is A or B
  let layout = ( nodeList[activeRowId].length == rowLayoutSpecs.a.count ) ? rowLayoutSpecs.a : rowLayoutSpecs.b;

  // Get nearest node ID using X-coord as percentage of nodes in layout
  const percent = (pcX - layout.start) / (cvsSize - 2*layout.start);
  const nearestNodeId = Math.round(percent * (layout.count-1));
  const nearestNode = nodeList[activeRowId][nearestNodeId];

  // Check if nearest node's x is within hitTolerance of player Character. Return if not
  if(Math.abs(pcX - nearestNode.X_COORD) > hitTolerance ) { return; }

  return nearestNode;
}


/*--------------------------------------------------------------------------------*/


function scoreUpdate(newScore) {
  if(!newScore) {
    newScore = score;
  }
  scoreDisplay.innerHTML = "Score: " + newScore;
}


/*--------------------------------------------------------------------------------*/


/** If player character is in the margins, send them back towards the center
  * Otherwise, change direction to user-specified direction
*/
function changePlayerDir(node) {

  if( node.X_COORD <= xMargin ) {

    nextDirection = directions.right;
  } else if ( node.X_COORD >=  cvsSize-xMargin) {

    nextDirection = directions.left;
  }

  if (charDirection != nextDirection) {
    console.log("Dir change from " + charDirection + " to " + nextDirection);
  }

  charDirection = nextDirection;
}


/*--------------------------------------------------------------------------------*/


function handleNodeCollisions() {
  const node = playerOnNode();

  // Clear collided node by moving it way off screen to the left
  if (node) {
    score += node.SCORE;
    changePlayerDir(node);
    node.X_COORD = -1000;
    scoreUpdate();
  }
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
    rot = rad;
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


function handleKeypress(e) {
  switch(e.keyCode) {
    // Thought this was 37 or 65
    case 97:
      nextDirection = directions.left;
      break;

    // Thought this was 39 or 68
    case 100:
      nextDirection = directions.right;
      break;

    case 32:
      isPaused = !isPaused;
      draw();
      break;

    default:
      console.log("unknown key pressed: " + e.keyCode);
  }
}


/*--------------------------------------------------------------------------------*/


function draw(){
  if (isPaused) { return; }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBG();
  drawPC();
  handleNodeCollisions();

  requestAnimationFrame(draw);
}


/*--------------------------------------------------------------------------------*/


// Set canvas scale
canvas.width = cvsSize;
canvas.height = cvsSize;

// Generate initial nodes
for (let i=0; i<14; i++) {
  nodeList.push(newNodeRow());
}

// Set player starting attributes
pcY = Math.ceil(pcY/lineSpacing)*lineSpacing;
charDirection = directions.left;
nextDirection = directions.left;

// Add event listener to Toggle pause when button clicked
pauseBtn.addEventListener("click", function() {
  isPaused = !isPaused;
  draw();
  console.log("isPaused: " + isPaused);
});

// Add Player Controls
document.addEventListener("keypress", e => handleKeypress(e));

draw();
