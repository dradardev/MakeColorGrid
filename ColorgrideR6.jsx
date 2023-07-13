// Constants
var DOCUMENT_SIZE = 7140;
var GRID_SIZE = 15;
var BOX_SIZE = 450;
var GAP_SIZE = 20;

// Gets user input for CMYK values
function getUserColor() {
    var color = new CMYKColor();
    
    color.cyan = getCMYKValue("Cyan");
    color.magenta = getCMYKValue("Magenta");
    color.yellow = getCMYKValue("Yellow");
    color.black = getCMYKValue("Black");

    return color;
}

function getCMYKValue(colorComponent) {
    var value;
    do {
        value = Number(prompt("Enter " + colorComponent + " Value:"));
        if (isNaN(value) || value < 0 || value > 100) {
            alert("Please enter a valid " + colorComponent + " value (0-100).");
        }
    } while (isNaN(value) || value < 0 || value > 100);

    return value;
}

// Draws a square at the given position with the given size and color
function drawSquare(doc, color, currentX, currentY, size) {
    var shapeRef = [
        [currentX, currentY], 
        [currentX + size, currentY], 
        [currentX + size, currentY + size], 
        [currentX, currentY + size]
    ];

    doc.selection.select(shapeRef);
    doc.selection.fill(color);
    doc.selection.deselect();
}

function addHueSaturation(doc, start, end, isRow) {
    for (var i = start; i < end; i++) {
        // Skip the 7th row or column
        if (i === 7) continue;
        
        var shapeRef;
        if (isRow) {
            shapeRef = [
                [0, i * (BOX_SIZE + GAP_SIZE)], 
                [DOCUMENT_SIZE, i * (BOX_SIZE + GAP_SIZE)], 
                [DOCUMENT_SIZE, (i * (BOX_SIZE + GAP_SIZE)) + BOX_SIZE], 
                [0, (i * (BOX_SIZE + GAP_SIZE)) + BOX_SIZE]
            ];
        } else {
            shapeRef = [
                [i * (BOX_SIZE + GAP_SIZE), 0], 
                [i * (BOX_SIZE + GAP_SIZE), DOCUMENT_SIZE], 
                [(i * (BOX_SIZE + GAP_SIZE)) + BOX_SIZE, DOCUMENT_SIZE], 
                [(i * (BOX_SIZE + GAP_SIZE)) + BOX_SIZE, 0]
            ];
        }

        doc.selection.select(shapeRef);
        app.doAction("AddAdjustmentLayer", "MakeColorGrid");
        doc.selection.deselect();
    }
}


// Adds a text layer at the given position
function addTextLayer(doc, text, currentX, currentY) {
    var textLayer = doc.artLayers.add();
    textLayer.kind = LayerKind.TEXT;
    var textItem = textLayer.textItem;
    textItem.contents = text;
    textItem.position = [new UnitValue(currentX, 'px'), new UnitValue(currentY, 'px')];
    return textLayer;
}

// Groups the given layers
function groupLayers(doc, layers, name) {
    var group = doc.layerSets.add();
    group.name = name;
    for (var i = 0; i < layers.length; i++) {
        layers[i].move(group, ElementPlacement.INSIDE);
    }
}

function main() {
    var doc = app.documents.add(DOCUMENT_SIZE, DOCUMENT_SIZE, 300, "Color Variations", NewDocumentMode.CMYK, DocumentFill.TRANSPARENT);
    var currentX = 0;
    var currentY = 0;

    var startColor = getUserColor();
    var color = new CMYKColor();
    color.cyan = startColor.cyan;
    color.magenta = startColor.magenta;
    color.yellow = startColor.yellow;
    color.black = startColor.black;

    for (var row = 0; row < GRID_SIZE; row++) {
        for (var column = 0; column < GRID_SIZE; column++) {
            drawSquare(doc, color, currentX, currentY, BOX_SIZE);
            currentX += BOX_SIZE + GAP_SIZE;
        }

        currentY += BOX_SIZE + GAP_SIZE;
        currentX = 0;
    }

    // Apply Hue/Saturation
    var rowColumnFlags = [true, false];
    for (var index = 0; index < rowColumnFlags.length; index++) {
        var isRow = rowColumnFlags[index];
        for (var startEndIndex = 0; startEndIndex < 2; startEndIndex++) {
            addHueSaturation(doc, startEndIndex * 8, (startEndIndex + 1) * 7, isRow);
        }
    }
    
    var letters = "ABCDEFGHIJKLMNOP".split('');
    currentY = 0;
    var textLayers = [];

    for (var row = 0; row < GRID_SIZE; row++) {
        textLayers.push(addTextLayer(doc, (row+1).toString(), DOCUMENT_SIZE - 54.44, currentY + BOX_SIZE / 2));
        textLayers.push(addTextLayer(doc, letters[row], currentY + BOX_SIZE / 2, DOCUMENT_SIZE - 56.68));
        currentY += BOX_SIZE + GAP_SIZE;
    }
    
    groupLayers(doc, textLayers, "Text Layers");

    // Execute the SetValues action
    app.doAction("SetValues", "MakeColorGrid");
}

main();
