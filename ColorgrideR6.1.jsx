#target photoshop

function drawSquare(doc, color, posX, posY, size) {
    var shapeRef = [
        [posX, posY], 
        [posX + size, posY], 
        [posX + size, posY + size], 
        [posX, posY + size]
    ];

    doc.selection.select(shapeRef);
    doc.selection.fill(color);
    doc.selection.deselect();
}

function addHueSaturation(doc, start, end, isRow) {
    for (var i = start; i < end; i++) {
        if (isRow) {
            doc.selection.select([[0, i * 470], [7140, i * 470], [7140, (i * 470) + 450], [0, (i * 470) + 450]]);
        } else {
            doc.selection.select([[i * 470, 0], [i * 470, 7140], [(i * 470) + 450, 7140], [(i * 470) + 450, 0]]);
        }

        app.doAction("AddAdjustmentLayer", "MakeColorGrid");

        doc.selection.deselect();
    }
}

function addTextLayer(doc, text, posX, posY) {
    var textLayer = doc.artLayers.add();
    textLayer.kind = LayerKind.TEXT;
    var textItem = textLayer.textItem;
    textItem.contents = text;
    textItem.position = [posX, posY];
    return textLayer;
}

function groupLayers(doc, layers, name) {
    var group = doc.layerSets.add();
    group.name = name;
    for (var i = 0; i < layers.length; i++) {
        layers[i].move(group, ElementPlacement.INSIDE);
    }
}

function main() {
    var colorSpace = Number(prompt("Select Color Space (Enter number):\n1. RGB (sRGB IEC61966-2.1)\n2. RGB (Adobe RGB (1998))\n3. CMYK (Coated GRACoL 2006 (ISO 12647-2:2004))"));

    var color;

    if (colorSpace === 1 || colorSpace === 2) { // RGB
        color = new RGBColor();
        color.red = Number(prompt("Enter Red Value:"));
        color.green = Number(prompt("Enter Green Value:"));
        color.blue = Number(prompt("Enter Blue Value:"));
    } else if (colorSpace === 3) { // CMYK
        color = new CMYKColor();
        color.cyan = Number(prompt("Enter Cyan Value:"));
        color.magenta = Number(prompt("Enter Magenta Value:"));
        color.yellow = Number(prompt("Enter Yellow Value:"));
        color.black = Number(prompt("Enter Black Value:"));
    } else {
        alert("Invalid color space selected");
        return;
    }

    alert("Please select the color profile in the New Document dialog based on your previous selection (sRGB IEC61966-2.1 or Adobe RGB (1998) for RGB, Coated GRACoL 2006 (ISO 12647-2:2004) for CMYK).");

    var doc = app.documents.add(7140, 7140, 300, "Color Variations", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);

    var boxSize = 450; // in pixels
    var gapSize = 20; // in pixels
    var posX = 0;
    var posY = 0;

    for (var i = 0; i < 15; i++) {
        for (var j = 0; j < 15; j++) {
            drawSquare(doc, color, posX, posY, boxSize);
            posX += boxSize + gapSize;
        }

        posY += boxSize + gapSize;
        posX = 0;
    }

    addHueSaturation(doc, 0, 7, true);
    addHueSaturation(doc, 8, 15, true);
    addHueSaturation(doc, 0, 7, false);
    addHueSaturation(doc, 8, 15, false);
    
    var letters = "ABCDEFGHIJKLMNOP".split('');
    posY = 0;
    var textLayers = [];

    for (var i = 0; i < 15; i++) {
        if(i < 15) {
            textLayers.push(addTextLayer(doc, letters[i], posY + 235, 7083.32));
        }
        textLayers.push(addTextLayer(doc, (i+1).toString(), 7085.56, posY + 235));
        posY += boxSize + gapSize;
    }
    
    groupLayers(doc, textLayers, "Text Layers");

    app.doAction("SetValues", "MakeColorGrid");
}

main();