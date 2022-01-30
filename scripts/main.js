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
let pathPoints = []; // This is a list of current allowed x coords to keep the PC on course

const cvsSize = lineSpacing*gridCount + 2*xMargin;

// Row layouts will be generated at runtime from rowLayoutSpecs
let rowLayout = {};

// Empty array to hold node list
let nodeList = [[]];
let nextRowIsA = false;

const nt = {
  EMPTY: "empty_node"
}

const goalNodePercent = 2/5; // The percent of grid nodes that are scoring nodes not black

// node types
const nodeType = {
  GOAL: {
    BLUE: {
      TYPE: "blue",
      COLOR: "blue",
      SCORE: 5
    },
    RED: {
      TYPE: "red",
      COLOR: "red",
      SCORE: 10
    }
  },
  EMPTY: {
    EMPTY: {
      TYPE: nt.EMPTY,
      COLOR: "black",
      SCORE: 0
    }
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
let goal = {};

const directions = {
  left: -1,
  right: 1,
  none: 0
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
  ctx.strokeStyle = "black";
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

    // Decide if node is empty or scoring/goal node based on goalNodePercent
    const nodeCategory = Math.random() <= goalNodePercent ? nodeType.GOAL : nodeType.EMPTY;

    const node = {...randEnumValue(nodeCategory)}; // Make new copy of nodeType template object
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

/**
  * Draws the input node at it's own X coord, input y coord
  * Optional third and 4th parameters specify if white outline or greying out should be appliedy
*/
function drawNode(node, y_coord, whiteOutline, isGreyedOut) {
  ctx.fillStyle = ctx.strokeStyle = node.COLOR;
  ctx.strokeStyle = whiteOutline ?  "white" : ctx.strokeStyle;

  const r = whiteOutline ? xMargin*(2/3) : xMargin/3;

  ctx.beginPath();
  ctx.arc(node.X_COORD, y_coord, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  if (isGreyedOut) {
    ctx.fillStyle = "rgb(40, 44, 52, 0.7)";
    ctx.beginPath();
    ctx.arc(node.X_COORD, y_coord, r, 0, 2 * Math.PI);
    ctx.fill()
  }
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
      drawNode(row[j], y);
    }
  }
}


/*--------------------------------------------------------------------------------*/


// This is a test function to visualize the pathPoints
function drawPathPoints() {

  for (p in pathPoints) {
    let newNode = {...randEnumValue(nodeType.GOAL)};
    newNode.X_COORD = pathPoints[p].X_COORD;
    drawNode(newNode, pcY, false, false);
  }
}


/*--------------------------------------------------------------------------------*/


function drawBG() {
  drawGrid();
  drawNodes();
  drawPathPoints();
  updatePathPoints();
}


/*--------------------------------------------------------------------------------*/


// Updates pathPoint X_COORD by adding/subtracting gravity based on point group and position in grid pattern
function updatePathPoints() {
  pathPoints = pathPoints.map( point => {
    point.X_COORD += gravity * point.GROUP * (nextRowIsA ? 1 : -1);
    return point;
  });
}


/*--------------------------------------------------------------------------------*/


/** Generates path points based on gridCount and lineSpacing global variables
  * Generates 2 pathPoints on each node, one traveling in each direction to cover all path
  * Assigns one of the pathPoint to the pathPoint attribute of the player character
  * Note that if the PC doesn't start exactly on a node, this won't work correctly
  */
function initPathPoints() {
  const pp1 = pcX - (gridCount/2) * lineSpacing;
  let group = -1;

  for (let i=0; i<gridCount; i+=0.5) {
    let index =  Math.ceil(i);
    let pathPoint = {
      X_COORD: pp1 + index*lineSpacing,
      GROUP: group
    }
    pathPoints.push(pathPoint);
    if (pathPoint.X_COORD == pcX) {
      pc.pointIndex = pathPoints.length-1;
    }
    group = 0-group; //Toggles between 1 and -1
  }
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
  } else { // If the direction didn't change, the PC changes path nodes (path nodes zigzag)
    pc.pointIndex = Math.min(Math.max(0, pc.pointIndex + nextDirection), pathPoints.length-1);
  }

  charDirection = nextDirection;
}


/*--------------------------------------------------------------------------------*/


/**
  * Updates score to reflect number of nodes in completed goal
  * Alerts user
  * Resets goal
*/
function finishGoal() {

  score += goal.PATTERN.length;

  scoreUpdate();
  alert("YAY! You completed the goal!");
  goalUpdate();
}


/*--------------------------------------------------------------------------------*/


/**
  * Checks if input node is of the type of the next node in the goal sequcne
  * If so, increment goal.NEXT, check if goal complete and run finishGoal() if so
  * If not, reset goal unless type is empty (EMPTY)
*/
function checkIfGoalNodeHit(node) {
  // Ingore empty nodes
  if (node.TYPE === nt.EMPTY) {
    return;
  }

  // Check if node type matches next goal pattern node
  if (node.TYPE === goal.PATTERN[goal.NEXT].TYPE) {
    console.log("Yep, it's a match: " + node.COLOR + " = " + goal.PATTERN[goal.NEXT].COLOR);
    goal.NEXT++;

    // Check if pattern is complete
    if (goal.NEXT >= goal.PATTERN.length) {
      finishGoal();
    }
  } else { // If hit wrong node, reset goal
    goal.NEXT = 0;
    console.log("Restarting goal");
  }
}


/*--------------------------------------------------------------------------------*/


/**
  * Checks for collision and gets colided node if there is one
  * Clears collided node by moving it way off screen to the left
  * Cheks for goal pattern match, updates score
*/
function handleNodeCollisions() {
  const node = playerOnNode();

  if (node) {
    //score += node.SCORE; // Turn this on to give points for all nodes based on SCORE parameter
    changePlayerDir(node);
    node.X_COORD = -1000

    checkIfGoalNodeHit(node);

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

  // Use the PC's current pathPoint attribute to correct trajectory errors
  // TO DO - can probably use the same logic used to turn the pathPoints to change rotation
  let pcPathPointX = pathPoints[pc.pointIndex].X_COORD;
  if ( Math.abs(pcX - pcPathPointX) > hitTolerance*100 ) {
    pcX = pcX + (pcPathPointX-pcX) / 20;
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


function drawHUD() {
  const nodeCount = goal.PATTERN.length;

  // HUD parameters
  const width = (lineSpacing/2) * nodeCount + xMargin*2; // Cram goal nodes in twice as tight, room for 5x with margin
  const height = lineSpacing;
  const xStart = cvsSize/2 - width/2;
  const yStart = xMargin/2;

  // Translate to HUD position
  ctx.translate(xStart, yStart);

  // Draw HUD
  ctx.beginPath();
  ctx.rect(0, 0, width, lineSpacing);
  ctx.fillStyle = "#282C34";
  ctx.strokeStyle = "black";
  ctx.fill();
  ctx.stroke();

  // HUD nodes
  ctx.translate((width/2)-(nodeCount/2 * lineSpacing/2) + 25, 0); // I do not understand where the 25 px offset comes from. It's 5/6ths of xMargin?
  for (let i=0; i<nodeCount; i++) {
    let whiteOutline = true;
    drawNode(goal.PATTERN[i], height/2, whiteOutline, i<goal.NEXT);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
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

/**
  * Sets the current goal to a sequence of nodeTypes and resets NEXT to 0
  * TO DO - Currently hardcoed so always blue, blue red. Fix this.
*/
function goalUpdate() {

  // Get randome length for goal pattern between 3 and 7
  let minLen = 3;
  let maxLen = 7;
  let randLen = Math.floor(Math.random() * (maxLen-minLen))+minLen;


  // Generate an array of randLen and populate it with random nodeType object instances
  // Assign each one an X_COORD based on it's position in the row
  goal.PATTERN = Array.from('x'.repeat(randLen))
    .map( (p, i) => {
      p = {...randEnumValue(nodeType.GOAL)};
      p.X_COORD = i*lineSpacing/2;
      return p;
    });

  goal.NEXT = 0;
  console.log("Next Goal is: " + JSON.stringify(goal.PATTERN));
}


/*--------------------------------------------------------------------------------*/


function draw(){
  if (isPaused) { return; }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBG();
  drawPC();
  drawHUD();

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

// Set initial goal
goalUpdate();

// Initialize path pathPoints
initPathPoints();

// Start canvas drawing animation
draw();
