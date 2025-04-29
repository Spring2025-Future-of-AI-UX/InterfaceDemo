// =================== GLOBAL VARIABLES =================== //
let imageData;
let groups = {};
let loadedImages = {};
let thumbnails = [];
let bookPositions = [];

let currentStage = 'home'; // Can be 'home', 'album', or 'imageDetail'

let showHomepage = true;
let showGallery = false;

let currentPeriod = null;
let selectedImage = null;

let backButtonHovered = false;
let searchInput;

const thumbnailSize = 250;
const maxImageSize = 512;
const shelfMargin = 20;

let carouselOffset = 0;
let maxScroll = 0;
let currentThumbnailIndex = 0;

let isEditing = false;

let descriptionGenerated = false;

// === New for Edit Suggestions ===
let editSuggestions = [];
let suggestionsGenerated = false;

let editButtonArea = null;
let descInput = null; // For editing descriptions

let isGeneratingSuggestions = false;
let loadingDots = "";
let lastDotUpdate = 0;

let isGeneratingDescription = false;
let descriptionDots = "";
let descriptionDotTimer = 0;

let suggestionAlpha = 0;       // For fade-in
let suggestionFadeInStart = 0; // When fade started
let suggestionFadeDuration = 800; // ms

let winkPosTagger;
let nTags = ["NN", "NNS", "NNP", "NNPS"];



// =================== PRELOAD =================== //
function preload() {
  imageData = loadJSON("metadata.json", (data) => {
    imageData = Object.values(data);
    for (let img of imageData) {
      let p5img = loadImage(img.src);
      p5img.resize(maxImageSize, 0);
      loadedImages[img.src] = p5img;
    }
  });
}

// =================== SETUP =================== //
function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(16);
  textAlign(LEFT, TOP);

  categorizeImages();

  // Setup search bar
  searchInput = createInput();
  searchInput.position(width / 2 - 250, 30);
  searchInput.size(500);
  searchInput.attribute("placeholder", "Search by tag or description...");
  searchInput.input(handleSearch);

  searchInput.style('border-radius', '16px');
  searchInput.style('padding', '10px');
}

// =================== CATEGORIZE BY YEAR =================== //
function categorizeImages() {
  groups = {}; // Reset
  imageData.sort((a, b) => new Date(b.date) - new Date(a.date));
  for (let img of imageData) {
    let date = new Date(img.date);
    let year = date.getFullYear();
    if (!groups[year]) groups[year] = [];
    groups[year].push(img);
  }
}

// =================== SEARCH FUNCTION (AND logic) =================== //
function handleSearch() {
  const query = searchInput.value().toLowerCase().trim();
  if (query === "") {
    categorizeImages();
    currentStage = 'home';
    return;
  }

  // List of common stopwords to ignore
  const stopwords = ["a", "an", "the", "and", "with", "of", "to", "in", "on", "for", "by", "is", "at", "from", "as"];
  
  // Break query into meaningful terms
  const queryWords = query.split(/\s+/).filter(word => !stopwords.includes(word));

  const results = imageData.filter((img) => {
    const desc = img.description?.toLowerCase() || "";
    const tags = (img.tags || []).map(tag => tag.toLowerCase());

    // Combine description and tags into one string for easier matching
    const combinedText = desc + " " + tags.join(" ");

    // Check if ALL important query words are in combined text
    return queryWords.every(word => combinedText.includes(word));
  });

  groups = { Search: results };
  currentPeriod = "Search";
  currentStage = 'album';
}


// =================== DRAW =================== //
function draw() {
  background(20);

  if (showHomepage) {
    displayAlbums();
    searchInput.show();
  } else if (showGallery) {
    displayThumbnails();
    drawBackButton();
    searchInput.show();
  } else if (selectedImage) {
    displayImageDetail();
    drawBackButton();
    searchInput.hide();
  }

  
}

// =================== DRAW BACK BUTTON =================== //
function drawBackButton() {
  let x = 20;
  let y = 20;
  let w = 100;
  let h = 40;

  backButtonHovered = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;

  fill(backButtonHovered ? '#444' : '#222');
  stroke(255);
  rect(x, y, w, h, 10);

  fill(255);
  noStroke();
  textSize(16);
  textAlign(CENTER, CENTER);
  text("← Back", x + w / 2, y + h / 2);
}

// =================== DISPLAY HOMEPAGE BOOKS =================== //
function displayAlbums() {
  clear();
  resizeCanvas(windowWidth, windowHeight);

  let bookX = 40;
  let bookY = 100;
  bookPositions = [];

  for (let i = 0; i < Object.keys(groups).length; i++) {
    let period = Object.keys(groups)[i];
    let albumImages = groups[period];
    let numImages = albumImages.length;

    let bookWidth = 60 + numImages * 2;
    let bookHeight = 240;

    let year = parseInt(period);
    let ageFactor = (new Date().getFullYear() - year) / 50;
    let baseColor = color(
      lerp(120, 180, ageFactor),
      lerp(60, 100, ageFactor),
      lerp(50, 80, ageFactor)
    );

    let isHovered = mouseX > bookX && mouseX < bookX + bookWidth &&
                    mouseY > bookY && mouseY < bookY + bookHeight;

    let displayColor = isHovered ? lerpColor(baseColor, color(255), 0.3) : baseColor;

    if (isHovered) {
      fill(0, 50);
      noStroke();
      rect(bookX + 5, bookY + 5, bookWidth, bookHeight, 5);
    }

    fill(displayColor);
    noStroke();
    rect(bookX, bookY, bookWidth, bookHeight, 5);

    fill(100);
    rect(bookX + bookWidth - 10, bookY, 10, bookHeight, 3);

    fill(255);
    push();
    translate(bookX + bookWidth / 2 + 10, bookY + bookHeight - 30);
    rotate(-HALF_PI);
    textAlign(CENTER, CENTER);
    text(period, 0, 0);
    pop();

    bookPositions.push({ x: bookX, y: bookY, w: bookWidth, h: bookHeight, period });

    bookX += bookWidth + 20;
    if (bookX > width - bookWidth) {
      bookX = 40;
      bookY += bookHeight + shelfMargin;
    }
  }
}

// =================== DISPLAY THUMBNAILS (ALBUM PAGE) =================== //
function displayThumbnails() {
  thumbnails = [];

  if (!groups[currentPeriod]) return;

  let thumbY = height / 2 - thumbnailSize / 2;
  let spacing = thumbnailSize + 40; // consistent clean spacing

  push();
  translate(-carouselOffset, 0); // move everything based on carousel scroll

  let thumbX = 60; // <-- Always start a little margin on left

  for (let img of groups[currentPeriod]) {
    let p5img = loadedImages[img.src];

    let sx = 0, sy = 0, sw = p5img.width, sh = p5img.height;
    if (sw > sh) {
      sx = (sw - sh) / 2;
      sw = sh;
    } else {
      sy = (sh - sw) / 2;
      sh = sw;
    }

    image(p5img, thumbX, thumbY, thumbnailSize, thumbnailSize, sx, sy, sw, sh);

    thumbnails.push({
      x: thumbX,
      y: thumbY,
      size: thumbnailSize,
      img: p5img,
      src: img.src,
    });

    thumbX += spacing;
  }

  pop();

  // Calculate scroll boundaries properly
  let totalContentWidth = (thumbnailSize + 40) * groups[currentPeriod].length;
  minScroll = 0;
  maxScroll = Math.max(0, totalContentWidth + 120 - width); // 120 = margin both sides
}

// =================== DRAW CAROUSEL NAV BUTTONS =================== //
function drawCarouselNavButtons() {
  // Previous button
  fill(255);
  rect(20, height / 2 - 30, 40, 60, 8);
  fill(0);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("<", 40, height / 2);

  // Next button
  fill(255);
  rect(width - 60, height / 2 - 30, 40, 60, 8);
  fill(0);
  textAlign(CENTER, CENTER);
  text(">", width - 40, height / 2);
}

// =================== CLICK HANDLING =================== //
function mousePressed() {
  // Check BACK button click
  if (backButtonHovered) {
    if (currentStage === 'imageDetail') {
      currentStage = 'album';
      showGallery = true;
      selectedImage = null;

      // Reset edit state and suggestion state
      isEditing = false;
      suggestionsGenerated = false;
      editSuggestions = [];

      if (descInput) {
        descInput.remove();
        descInput = null;
      }
      if (editButton) {
        editButton.remove();
        editButton = null;
      }

    } else if (currentStage === 'album') {
      currentStage = 'home';
      currentPeriod = null;
      showGallery = false;
      showHomepage = true;
      carouselOffset = 0;
      currentThumbnailIndex = 0;
    }
  }

  // Homepage album click
  if (showHomepage) {
    for (let book of bookPositions) {
      if (
        mouseX > book.x && mouseX < book.x + book.w &&
        mouseY > book.y && mouseY < book.y + book.h
      ) {
        currentPeriod = book.period;
        currentStage = 'album';
        showHomepage = false;
        showGallery = true;
        carouselOffset = 0;
        currentThumbnailIndex = 0;
        return;
      }
    }
  }

  // Carousel nav or thumbnail click
  if (showGallery) {
    // Left arrow
    if (mouseX > 20 && mouseX < 80 && mouseY > height / 2 - 30 && mouseY < height / 2 + 30) {
      currentThumbnailIndex = max(0, currentThumbnailIndex - 1);
      centerThumbnail(currentThumbnailIndex);
      return;
    }

    // Right arrow
    if (mouseX > width - 80 && mouseX < width - 20 && mouseY > height / 2 - 30 && mouseY < height / 2 + 30) {
      if (groups[currentPeriod]) {
        currentThumbnailIndex = min(groups[currentPeriod].length - 1, currentThumbnailIndex + 1);
        centerThumbnail(currentThumbnailIndex);
      }
      return;
    }

    // Thumbnail click
    for (let i = 0; i < thumbnails.length; i++) {
      let thumb = thumbnails[i];
      if (
        mouseX > thumb.x - carouselOffset &&
        mouseX < thumb.x - carouselOffset + thumb.size &&
        mouseY > thumb.y &&
        mouseY < thumb.y + thumb.size
      ) {
        selectedImage = thumb.img;
        showGallery = false;
        currentStage = 'imageDetail';
        window.scrollTo(0, 0);
        return;
      }
    }
  }
}


// =================== CENTER THUMBNAIL =================== //
function centerThumbnail(index) {
  if (!groups[currentPeriod]) return;

  let spacing = thumbnailSize + 40;
  let centerX = width / 2;

  let thumbX = 60 + index * spacing + thumbnailSize / 2; // starting margin + position

  let desiredOffset = thumbX - centerX;

  desiredOffset = constrain(desiredOffset, minScroll, maxScroll);

  carouselOffset = desiredOffset;
}


// =================== SCROLL WHEEL =================== //
function mouseWheel(event) {
  const scrollAmount = 60;

  if (event.delta > 0) {
    carouselOffset = min(maxScroll, carouselOffset + scrollAmount);
  } else {
    carouselOffset = max(minScroll, carouselOffset - scrollAmount);
  }

  return false;
}


// =================== DISPLAY IMAGE DETAIL PAGE =================== //
function displayImageDetail() {
  background(20);

  if (!selectedImage) return;

  let maxSide = 512;
  let w = selectedImage.width;
  let h = selectedImage.height;

  if (w > h) {
    h = (selectedImage.height * maxSide) / selectedImage.width;
    w = maxSide;
  } else {
    w = (selectedImage.width * maxSide) / selectedImage.height;
    h = maxSide;
  }

  let centerX = width / 2;
  let imgX = centerX - w - 40;
  let imgY = 50;

  fill(255);
  rect(imgX - 10, imgY - 10, w + 20, h + 20, 10);
  image(selectedImage, imgX, imgY, w, h);

  let selected = imageData.find(img => loadedImages[img.src] === selectedImage);
  if (!selected) return;

  // 🔄 Generate description if missing
  if (!selected.description && !descriptionGenerated) {
    descriptionGenerated = true;
    const base64 = encodeImg(selectedImage);
    generateVisionContent(base64, "Describe this image in one sentence.").then((desc) => {
      selected.description = desc || "No description available.";
      descriptionFadeInStart = millis(); // Start fade-in when generated
      descriptionGenerated = false;
    }).catch(err => {
      console.error("Failed to generate description:", err);
      selected.description = "(Error generating description)";
      descriptionFadeInStart = millis(); 
      descriptionGenerated = false;
    });
  }

  // 🔄 Generate suggestions if missing
  if (selected.description && editSuggestions.length === 0 && !suggestionsGenerated) {
    generateEditGuides(selected);
    suggestionsGenerated = true;
  }

  let rightX = centerX + 40;
  let rightW = w;
  let currentY = imgY;

  // ----- Description Label -----
  fill(255);
  textAlign(LEFT, CENTER);
  textSize(16);
  text("Description:", rightX, currentY);

  let editButtonSize = 28;
  let editButtonX = rightX + rightW - editButtonSize;
  let editButtonY = currentY - 12;

  if (!this.editButton) {
    this.editButton = createButton(isEditing ? "💾" : "✏️");
    this.editButton.size(editButtonSize, editButtonSize);
    this.editButton.style('border-radius', '50%');
    this.editButton.style('font-size', '16px');
    this.editButton.style('background-color', '#444');
    this.editButton.style('color', 'white');
    this.editButton.mousePressed(() => {
      isEditing = !isEditing;
      if (!isEditing && this.descInput) {
        selected.description = this.descInput.value();
        saveJSON(imageData, "metadata.json");
      }
      this.editButton.html(isEditing ? "💾" : "✏️");
    });
  }
  this.editButton.position(editButtonX, editButtonY);
  currentY += 30;

  // ----- Description Text/Input -----
  if (isEditing) {
    if (!this.descInput) {
      this.descInput = createInput(selected.description || "");
      this.descInput.elt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          selected.description = this.descInput.value();
          saveJSON(imageData, "metadata.json");
          isEditing = false;
          if (this.descInput) {
            this.descInput.remove();
            this.descInput = null;
          }
          if (this.editButton) {
            this.editButton.html("✏️");
          }
        }
      });

      this.descInput.size(rightW);
      this.descInput.position(rightX, currentY);
    }
    currentY += 50;
  } else {
    if (this.descInput) {
      this.descInput.remove();
      this.descInput = null;
    }

    textAlign(LEFT, TOP);
    textSize(14);

    // Fade-in for description
    if (descriptionGenerated) {
      // While generating
      if (millis() - lastDotUpdate > 500) {
        loadingDots = loadingDots.length >= 3 ? "" : loadingDots + ".";
        lastDotUpdate = millis();
      }
      fill(180);
      text("- Generating description" + loadingDots, rightX, currentY);
      currentY += 30;
    } else {
      // After generated, fade it in
      let descAlpha = 255;
      if (descriptionFadeInStart) {
        let fadeProgress = constrain((millis() - descriptionFadeInStart) / 800, 0, 1);
        descAlpha = lerp(0, 255, fadeProgress);
      }

      push();
      fill(255, descAlpha);
      let wrappedLines = wrappedTextLines(selected.description || "No description available.", rightW);
      for (let line of wrappedLines) {
        text(line, rightX, currentY);
        currentY += 20;
      }
      pop();
    }
  }

  currentY += 20;

  // ----- Suggestions -----
  fill(255);
  textSize(14);
  text("Suggestions:", rightX, currentY);
  currentY += 25;

  if (isGeneratingSuggestions) {
    if (millis() - lastDotUpdate > 500) {
      loadingDots = loadingDots.length >= 3 ? "" : loadingDots + ".";
      lastDotUpdate = millis();
    }
    fill(180);
    text("- Generating suggestions" + loadingDots, rightX, currentY);
    currentY += 20;

  } else if (editSuggestions.length > 0) {
    let fadeProgress = constrain((millis() - suggestionFadeInStart) / suggestionFadeDuration, 0, 1);
    suggestionAlpha = lerp(suggestionAlpha, 255, fadeProgress);

    push();
    fill(255, suggestionAlpha);
    for (let suggestion of editSuggestions) {
      let lines = wrappedTextLines(suggestion, rightW);
      for (let line of lines) {
        text("- " + line, rightX, currentY);
        currentY += 20;
      }
      currentY += 10;
    }
    pop();

  } else {
    fill(180);
    text("- (No suggestions available)", rightX, currentY);
    currentY += 20;
  }

  currentY += 30;

  // ----- Tags -----
  if (selected.tags && selected.tags.length > 0) {
    let tagX = rightX;
    let tagY = currentY;
    let tagSpacing = 8;
    textSize(14);

    for (let tag of selected.tags) {
      let tw = textWidth(tag) + 24;
      if (tagX + tw > rightX + rightW) {
        tagX = rightX;
        tagY += 40;
      }

      fill(0, 102, 204);
      noStroke();
      rect(tagX, tagY, tw, 30, 12);

      fill(255);
      textAlign(LEFT, CENTER);
      text(tag, tagX + 12, tagY + 15);

      tagX += tw + tagSpacing;
    }
  } else {
    text("(No tags available)", rightX, currentY);
  }
}


function generateEditGuides(selected) {
  if (!selected) return;

  const prompt = `
    Given the following image description and tags, suggest 2 ways that guide the user to personalize it more.

    Description: "${selected.description || "No description."}"
    Tags: ${selected.tags ? selected.tags.join(', ') : "No tags."}

    Make the suggestions guides user to make something:
    - Personal (mention feelings, memories, or context)
    - Brief (one sentence each)
    - Easy to follow
  `;

  isGeneratingSuggestions = true;
  editSuggestions = [];  // Clear old suggestions while loading

  generateGeminiText(prompt).then(response => {
    console.log("🔍 Full Gemini API response:", response);

    let text = "";

    try {
      if (typeof response === "string") {
        text = response;
      } else if (response.candidates && response.candidates.length > 0) {
        const parts = response.candidates[0].content.parts;
        if (parts && parts.length > 0 && parts[0].text) {
          text = parts[0].text;
        }
      }

      if (text.trim().length > 0) {
        editSuggestions = text.split(/\n+/).map(line => line.trim()).filter(line => line.length > 0);
      } else {
        editSuggestions = ["(No suggestions available)"];
      }

    } catch (error) {
      console.error("❌ Error parsing Gemini response:", error);
      editSuggestions = ["(Failed to extract suggestions)"];
    }

    isGeneratingSuggestions = false;
    suggestionAlpha = 0;
    suggestionFadeInStart = millis(); // Start fade timing

  }).catch(error => {
    console.error("❌ Error contacting Gemini:", error);
    editSuggestions = ["(Error fetching suggestions)"];
    isGeneratingSuggestions = false;
    suggestionAlpha = 0;
    suggestionFadeInStart = millis(); // Start fade timing

  });
}

function wrappedTextLines(txt, maxWidth, textSizeValue = 14) {
  textSize(textSizeValue);
  let words = txt.split(' ');
  let lines = [];
  let line = '';

  for (let word of words) {
    let testLine = line + word + ' ';
    if (textWidth(testLine) > maxWidth && line !== '') {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = testLine;
    }
  }

  if (line !== '') {
    lines.push(line.trim());
  }

  return lines;
}
