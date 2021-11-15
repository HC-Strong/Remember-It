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
  BLUE: "blue",
  RED: "red",
  BLACK: "black"
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
let simpleScore = 0;
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

    if (nextRowIsA) {
      nodeList.push(generateRowLayouts(rowLayoutSpecs.a));
    } else {
      nodeList.push(generateRowLayouts(rowLayoutSpecs.b));
    }

    //nextRowIsA = !nextRowIsA;
  }
  prevBgTranslate = bgTranslate;
}

/*--------------------------------------------------------------------------------*/

function drawNodes() {

  manageNodes();

  for (let i=0; i<nodeList.length; i++) {

    // nextRowIsA toggles as the offset needs to change size
    let y = i*lineSpacing/2 - bgTranslate + nextRowIsA*lineSpacing/2;

    // Set color and activeRowY if current row is active row
    if (i==activeRowId) {
      ctx.strokeStyle = "teal";
      ctx.fillStyle = "blue";
      activeRowY = y;
    } else {
      ctx.strokeStyle = "blue";
      ctx.fillStyle = "blue";
    }

    //let xVals = nodeList[i]; TO DO - use map here to actually get xVals
    let theNodes = nodeList[i];

    //for (let j=0; j<xVals.length; j++) {
    for (let j=0; j<theNodes.length; j++) {
      ctx.beginPath();
      //ctx.arc(xVals[j].X, y, 10, 0, 2 * Math.PI); // NODE REF
      ctx.arc(theNodes[j].X_COORD, y, 10, 0, 2 * Math.PI); // NODE REF
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

  // Check if active row layout is A or B, determine nearest node accordingly
  let layout = ( nodeList[activeRowId].length == rowLayout.a.length ) ? rowLayoutSpecs.a : rowLayoutSpecs.b;
  const percent = (pcX - layout.start) / (cvsSize - 2*layout.start);
  const nearestNodeId = Math.round(percent * (layout.count-1));

  // Check if neareset node is within hitTolerance
  const nearestNodeX = nodeList[activeRowId][nearestNodeId].X_COORD; // NODE REF

  // Check if nearest node's x is within hitTolerance of player Character. Return if not
  if(Math.abs(pcX - nearestNodeX) > hitTolerance ) { return; }


  return {
    row: activeRowId,
    col: nearestNodeId
  };
}


/*--------------------------------------------------------------------------------*/


function simpleScoreUpdate(newScore) {
  if(!newScore) {
    newScore = simpleScore;
  }
  scoreDisplay.innerHTML = "Score: " + newScore;
}


/*--------------------------------------------------------------------------------*/


/* Check if hit edge, change direction if so
* Otherwise, change direction to user-specified direction */
function changePlayerDir(node) {

  if( nodeList[node.row][node.col].X_COORD == xMargin ) { // NODE REF - row is ok, col will no longer refer just x coord, but will reference the entire node info

    nextDirection = directions.right;
  } else if ( node.col == gridCount ) {

    nextDirection = directions.left;
  }
  console.log("Dir change from " + charDirection + " to " + nextDirection);
  charDirection = nextDirection;
}


/*--------------------------------------------------------------------------------*/


function handleNodeCollisions() {
  const node = playerOnNode();

  // Clear collided node by moving it way off screen to the left
  if (node) {
    simpleScore++;
    changePlayerDir(node);
    nodeList[node.row][node.col].X_COORD = -1000; // NODE REF - row is ok, col will no longer refer just x coord, but will reference the entire node info
    simpleScoreUpdate();
    console.log("------------------------------------------------");
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

// Take data from rowLayoutSpecs variable and generate the actual row layout array
function generateRowLayouts(layoutSpec) {
  let layoutArr = [];

  for (let i=0; i<layoutSpec.count; i++) {
    let color = nodeType.BLACK;
    if(i % 2 == 0) {
      nodeType.RED;
    }
    let nodeObj = {
      X_COORD: (layoutSpec.start + i*lineSpacing),
      COLOR: color
    };

    layoutArr.push(nodeObj);
  }
  console.log(layoutArr);
  nextRowIsA = !nextRowIsA;
  return layoutArr;
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

// Generate row layout arrays from rowLayoutSpecs
rowLayout.a = generateRowLayouts(rowLayoutSpecs.a);
rowLayout.b = generateRowLayouts(rowLayoutSpecs.b);

// nodeList.push([...rowLayout.b]);
// nodeList.push([...rowLayout.a]);
// nodeList.push([...rowLayout.b]);
// nodeList.push([...rowLayout.a]);
// nodeList.push([...rowLayout.b]);
// nodeList.push([...rowLayout.a]);
// nodeList.push([...rowLayout.b]);
// nodeList.push([...rowLayout.a]);
// nodeList.push([...rowLayout.b]);
// nodeList.push([...rowLayout.a]);
// nodeList.push([...rowLayout.b]);
// nodeList.push([...rowLayout.a]);
// nodeList.push([...rowLayout.b]);
// nodeList.push([...rowLayout.a]);


for (let i=0; i<14; i++) {
  // nodeList.push(newNodeRow());
  nodeList.push(generateRowLayouts(rowLayoutSpecs.b));
  // nextRowIsA = !nextRowIsA;
}


// Set player starting attributes
pcY = Math.ceil(pcY/lineSpacing)*lineSpacing;
charDirection = directions.left;
nextDirection = directions.left;

// Toggle pause when button clicked
pauseBtn.addEventListener("click", function() {
  isPaused = !isPaused;
  draw();
  console.log("isPaused: " + isPaused);
});

// Add Player Controls
document.addEventListener("keypress", e => handleKeypress(e));

draw();
