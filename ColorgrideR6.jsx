/**
 * @fileoverview
 * This script will create a 15 x 15 grid of 1.5inx1.5in colors for color exploration.
 * The user will be prompted to create a document via Photoshops new document dialog box,
 * The script will then read the documents color space and prompt the user for color values 
 * based on the color space (RGB or CMYK)
 * @version 1.0.1
 * @company Calico Wallpaper
 * @author Devin Doppler
 * @contributors Alexander Moss, ChatGPT
 */

// Constants
var DOCUMENT_SIZE = 7140;
var GRID_SIZE = 15;
var BOX_SIZE = 450;
var GAP_SIZE = 20;

//Define Color and Color Space
function getCMYKUserColor() {
    var color = new CMYKColor();
    
    color.cyan = getCMYKValue("Cyan");
    color.magenta = getCMYKValue("Magenta");
    color.yellow = getCMYKValue("Yellow");
    color.black = getCMYKValue("Black");

    return color;
}

function getRGBUserColor() {
    var color = new RGBColor();

    color.red = getRGBValue("Red");
    color.green = getRGBValue("Green");
    color.blue = getRGBValue("Blue");

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

function getRGBValue(colorComponent) {
    var value;
    do {
        value = Number(prompt("Enter " + colorComponent + " Value:"));
        if (isNaN(value) || value < 0 || value > 255) {
            alert("Please enter a valid " + colorComponent + " value (0-255).");
        }
    } while (isNaN(value) || value < 0 || value > 255);

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
    for (var i = start; i <= end; i++) {
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
    
    var startColor;
    if (doc.mode === DocumentMode.CMYK) {
        startColor = getCMYKUserColor();
    } else if (doc.mode === DocumentMode.RGB) {
        startColor = getRGBUserColor();
    } else {
        alert("Unsupported color mode: " + doc.mode);
        return;
    }

    for (var row = 0; row < GRID_SIZE; row++) {
        for (var column = 0; column < GRID_SIZE; column++) {
            drawSquare(doc, startColor, currentX, currentY, BOX_SIZE);
            currentX += BOX_SIZE + GAP_SIZE;
        }

        currentY += BOX_SIZE + GAP_SIZE;
        currentX = 0;
    }

    // Apply Hue/Saturation
    var rowColumnFlags = [true, false];
    for (var index = 0; index < rowColumnFlags.length; index++) {
        var isRow = rowColumnFlags[index];
        addHueSaturation(doc, 0, 14, isRow);
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
    // User can change the values with in the PS Action
    app.doAction("SetValues", "MakeColorGrid");

    //Auto Save Function
    var saveFolder = Folder.selectDialog("Select a folder to save your files");
    if (saveFolder) {
        // Create a custom dialog for TIFF compression preference
        var dialog = new Window('dialog', 'Compression');
        dialog.add('statictext', undefined, 'Save with LZW compression?');
        var yesButton = dialog.add('button', undefined, 'Yes', {name: 'ok'});
        var noButton = dialog.add('button', undefined, 'No', {name: 'cancel'});

        var result = dialog.show();

        var fileName = doc.name.replace(/\.[^\.]+$/, ''); // Strip the extension of the document name
        
        // Save as PSD
        var saveOptions = new PhotoshopSaveOptions();
        var psdFile = new File(saveFolder.fsName + "/" + fileName + ".psd");
        doc.saveAs(psdFile, saveOptions, true, Extension.LOWERCASE);

        // Flatten the document

        doc.flatten();

        // Save as TIFF
        var tiffOptions = new TiffSaveOptions();
        tiffOptions.imageCompression = result === 1 ? TIFFEncoding.TIFFLZW : TIFFEncoding.NONE; // Use LZW compression if user chose 'Yes', otherwise no compression
        var tiffFile = new File(saveFolder.fsName + "/" + fileName + ".tif");
        doc.saveAs(tiffFile, tiffOptions, true, Extension.LOWERCASE);
    }
    
}

main();
