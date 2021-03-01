/** -- Operations -- **/

// Get the data, and if it exists, resurrect
let data = get("inputData");
if (data !== undefined) data = data.resurrect();

// If the uploaded data and the SVG are present, do things
if (data && get("svgUpload")) doThings();


/** -- Function definitions -- **/

// Function to check whether two nodes are at least partially overlapping
function overlapping(node0, node1) {
  function inRangeX(value) {
    let x = {min: boundsRef.left, max: boundsRef.right};
    if (value >= x.min && value <= x.max) return true;
    return false;
  };
  function inRangeY(value) {
    let y = {min: boundsRef.top, max: boundsRef.bottom};
    if (value >= y.min && value <= y.max) return true;
    return false;
  };
  let boundsRef = node0.getBoundingClientRect();
  let boundsCheck = node1.getBoundingClientRect();
  let h = (inRangeX(boundsCheck.left) || inRangeX(boundsCheck.right));
  let v = (inRangeY(boundsCheck.top) || inRangeY(boundsCheck.bottom));
  if (h && v) return true;
  return false;
};

// Callback version of forEach operations, for a bit of easier editing/tracing
function doThingsDataCallback(data, svg, nodes, paths) {
  // Get the relevant ID for the radial gradient
  let urlId = `rg_${data.name.replace(/\W/g, "_")}`;
  // Test to see if the definition exists -- if so, remove it
  let test = document.querySelector(`#${urlId}`);
  if (test !== null) test.remove();
  // Define the radial gradient
  radialGradient(svg, makeStops(data), {id: urlId});
  // Get the DOM node groups
  let groups = nodes
    .filter(n => n.name === data.name)
    .map(e => e.groups)
    .flat();
  // For each group element
  groups.forEach(group => {
    // Jeg drikker mange, takk
    let ol = paths.filter(p => overlapping(group, p));
    // For each overlapping element
    ol.forEach(o => {
      // Get the paths and polygons
      let pathSub = getElementsByXpath(`./s:path[@data-colored="true"]`, o);
      let poly = getElementsByXpath(`./s:polygon`, o);
      // For each path
      pathSub.forEach(p => {
        // Set the stroke width to scale by effect strength
        p.setAttribute("stroke-width", 3 * (1 + +data.strength));
      });
    });
    // Get the circles within
    let circles = getElementsByXpath(`./s:circle`, group);
    // Apply the radial gradient
    circles.forEach(c => c.style.fill = `url(#${urlId})`);
  });
};

// Wrapper or shorthand function, to do things
function doThings() {
  let svg = getElementByXpath(`//div[@id="svgInput"]/s:svg`);
  let nodes = allText();
  let paths = getElementsByXpath(`//s:path[@data-colored="true"]/..`);
  data.forEach(d => doThingsDataCallback(d, svg, nodes, paths));
};

// Helper function to make a generic set of stops for a radial gradient
function makeStops(d) {
  return [
    {
      offset: (d.strength === undefined) ? "65%" : `${d.strength * 100}%`,
      "stop-color": d.colour,
      "stop-opacity": 1
    },
    {
      offset: "100%",
      "stop-color": "#000",
      "stop-opacity": 1
    }
  ]
};

// Helper function to apply a set of attributes to a DOM node
function applyAttrs(node, attrs) {
  for (let a in attrs) {
    // If it's a style object, treat it differently
    if (a === "style") {
      for (let b in attrs.style) node.style[b] = attrs.style[b];
    } else {
      node.setAttribute(a, attrs[a]);
    }
  };
  return node;
};

// Helper function to apply a set of default values inside a function
function applyDefaults(input, defaults) {
  for (let k in defaults) {
    if (input[k] === undefined) input[k] = defaults[k];
  };
  return input;
};

// Helper function for creating an element in the SVG namespace
function svgns(type) {
  return document.createElementNS("http://www.w3.org/2000/svg", type);
};

// Helper function for creating a radial gradient definition in an SVG
function radialGradient(svg, stops, opt = {}) {
  let d = {
    id: "defGrad",
    cx: "50%",
    cy: "50%",
    fx: "50%",
    fy: "50%",
    r: "50%"
  };
  let attrs = applyDefaults(opt, d);
  let rg = applyAttrs(svgns("radialGradient"), attrs);
  for (let i = 0; i < stops.length; ++i) {
    let stop = stops[i];
    let addNew = svgns("stop");
    for (let a in stop) {
      if (stop.hasOwnProperty(a)) addNew.setAttribute(a, stop[a]);
    };
    rg.appendChild(addNew);
  };
  let defs = svg.querySelector("defs");
  if (!defs) {
    svg.insertBefore(svgns("defs"), svg.firstChild);
    defs = svg.querySelector("defs");
  };
  return defs.appendChild(rg);
};

// Helper function for getting all node groups in a PathBank Simple SVG
function allText() {
  let xp = {
    text: `//s:text`,
    tspan: `./s:tspan`,
    g: `./..`
  };
  let text = getElementsByXpath(xp.text);
  return text.map(tx => {
    let name = new String();
    let pg = getElementsByXpath(xp.g, tx);
    let tspan = getElementsByXpath(xp.tspan, tx);
    tspan.forEach(ts => {
      let ih = ts.innerHTML;
      name += (name.length === 0 || /-$/.test(name)) ? ih : ` ${ih}`;
    });
    return {name: name, groups: pg};
  });
};


/** ---- XPATH UTILS ---- **/

function getElementByXpath(xpath, node = document) {
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
  let snapshot = document.evaluate(
    xpath,
    node,
    nsResolver,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  if (snapshot.snapshotLength === 0) return null;
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
  return snapshot.snapshotItem(0);
};

function getElementsByXpath(xpath, node = document) {
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
  let output = new Array();
  let snapshot = document.evaluate(
    xpath,
    node,
    nsResolver,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  if (snapshot.snapshotLength === 0) return null;
  for (let i = 0; i < snapshot.snapshotLength; ++i) {
    output.push(snapshot.snapshotItem(i));
  };
  return output;
};
