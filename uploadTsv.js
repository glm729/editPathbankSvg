// Retrieve the uploaded TSV data and strip trailing newlines
let tsv = get("tsvUpload").replace(/\n+$/, '');

// Initialise options for Papa Parser
let padreOpts = {delimiter: "\t", header: true};

// Parse the TSV as JSON and get the data
let data = Papa.parse(tsv, padreOpts).data;

// Save the data as `inputData`
set("inputData", data);
