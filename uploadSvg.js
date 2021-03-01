/** ---- Operations ---- **/

// Find the input SVG sink and set innerHTML
let sink = document.querySelector("#svgInput");
sink.innerHTML = get("svgUpload");

// Get the target height and width for the display box
let targHeight = sink.parentElement.clientHeight;
let targWidth = sink.parentElement.clientWidth;

// Get the main pathway grouping node
let g = getElementByXpath(`//s:g[@id="pathway"]`);

// Get the main rectangle under the grouping node
let rect = g.firstElementChild;

// Get the height and width of the rectangle
let height = rect.getAttribute("height");
let width = rect.getAttribute("width");

// Get the X and Y scales to apply in the transform
let scaleX = targWidth / width;
let scaleY = targHeight / height;

// Pick the smallest to scale the rectangle, preserving aspect ratio
let scaleFactor = (scaleX < scaleY) ? scaleX : scaleY;

// Get the transform string and set the main group transform
let tf = `translate(0,0) scale(${scaleFactor},${scaleFactor})`
g.setAttribute("transform", tf);

// Set the height and width of the SVG (avoid scrollbars in the twig)
g.parentNode.setAttribute("height", targHeight);
g.parentNode.setAttribute("width", targWidth);


/** ---- Function definitions ---- **/

// Apply a set of attributes to a DOM node
function applyAttrs(node, attrs) {
  for (let a in attrs) {
    // If it's a style Object, apply those differently
    if (a === "style") {
      for (let b in attrs.style) node.style[b] = attrs.style[b];
    } else {
      node.setAttribute(a, attrs[a]);
    }
  };
  return node;
};

// Apply a set of default values in a function
function applyDefaults(input, defaults) {
  for (let k in defaults) {
    // If the input set doesn't have it, make it the default value
    if (input[k] === undefined) input[k] = defaults[k];
  };
  return input;
};

// Helper function for returning a node created in the SVG namespace
function svgns(type) {
  return document.createElementNS("http://www.w3.org/2000/svg", type);
};

// Create a radial gradient within an SVG
function radialGradient(svg, stops, opt = {}) {
  // Defaults
  let d = {
    id: "defGrad",
    cx: "50%",
    cy: "50%",
    fx: "50%",
    fy: "50%",
    r: "50%"
  };
  // Apply the defaults
  let attrs = applyDefaults(opt, d);
  // Create the radial gradient
  let rg = applyAttrs(svgns("radialGradient"), attrs);
  // Create the stops and append to the radial gradient
  stops.forEach(stop => {
    let addNew = svgns("stop");
    for (let a in stop) {
      if (stop.hasOwnProperty(a)) addNew.setAttribute(a, stop[a]);
    };
    rg.appendChild(addNew);
  });
  // Get the definitions object in the SVG
  let defs = svg.querySelector("defs");
  // If it doesn't exist, create it
  if (!defs) {
    svg.insertBefore(svgns("defs"), svg.firstChild);
    defs = svg.querySelector("defs");
  };
  return defs.appendChild(rg);
};


/** ---- XPATH UTILS ---- **/

// Get a single element by Xpath
function getElementByXpath(xpath, node = document) {
  // Helper namespace resolver
  function nsResolver(p) {
    let group = {
      mathml: "http://www.w3.org/1998/Math/MathML",
      s: "http://www.w3.org/2000/svg",
      svg: "http://www.w3.org/2000/svg",
      x: "http://www.w3.org/1999/xhtml",
      xhtml: "http://www.w3.org/1999/xhtml",
      xlink: "http://www.w3.org/1999/xlink"
    };
    return group[p] || null;
  };
  // Get the node snapshot
  let snapshot = document.evaluate(
    xpath,
    node,
    nsResolver,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  // If none, return null
  if (snapshot.snapshotLength === 0) return null;
  // If more than one, warn the user
  if (snapshot.snapshotLength > 1) {
    console.warn(
      [
        "XPath snapshot captures ",
        snapshot.snapshotLength,
        " nodes, but only the first is returned.\n",
        "Consider using getElementsByXpath instead."
      ].join('')
    );
  };
  // Return the first element only
  return snapshot.snapshotItem(0);
};

// Get an array of elements by Xpath
function getElementsByXpath(xpath, node = document) {
  // Helper namespace resolver
  function nsResolver(p) {
    let group = {
      mathml: "http://www.w3.org/1998/Math/MathML",
      s: "http://www.w3.org/2000/svg",
      svg: "http://www.w3.org/2000/svg",
      x: "http://www.w3.org/1999/xhtml",
      xhtml: "http://www.w3.org/1999/xhtml",
      xlink: "http://www.w3.org/1999/xlink"
    };
    return group[p] || null;
  };
  // Initialise output
  let output = new Array();
  // Get the node snapshot
  let snapshot = document.evaluate(
    xpath,
    node,
    nsResolver,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  // If none, return null
  if (snapshot.snapshotLength === 0) return null;
  // Loop for the snapshot length and push to the output
  for (let i = 0; i < snapshot.snapshotLength; ++i) {
    output.push(snapshot.snapshotItem(i));
  };
  return output;
};

