#target photoshop

// Constants
const DOCUMENT_SIZE = 7140;
const GRID_SIZE = 15;
const BOX_SIZE = 450;
const GAP_SIZE = 20;

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
        value = Number(prompt(`Enter ${colorComponent} Value:`));
        if (isNaN(value) || value < 0 || value > 100) {
            alert(`Please enter a valid ${colorComponent} value (0-100).`);
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

// Adds a hue/saturation adjustment to a row or column
function addHueSaturation(doc, start, end, isRow) {
    for (var i = start; i < end; i++) {
        var shapeRef;
        if (isRow) {
            shapeRef = [[0, i * BOX_SIZE], [DOCUMENT_SIZE, i * BOX_SIZE], [DOCUMENT_SIZE, (i * BOX_SIZE) + BOX_SIZE], [0, (i * BOX_SIZE) + BOX_SIZE]];
        } else {
            shapeRef = [[i * BOX_SIZE, 0], [i * BOX_SIZE, DOCUMENT_SIZE], [(i * BOX_SIZE) + BOX_SIZE, DOCUMENT_SIZE], [(i * BOX_SIZE) + BOX_SIZE, 0]];
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
    textItem.position = [currentX, currentY];
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
    for (let isRow of [true, false]) {
        for (let startEnd of [[0, 7], [8, 15]]) {
            addHueSaturation(doc, startEnd[0], startEnd[1], isRow);
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
