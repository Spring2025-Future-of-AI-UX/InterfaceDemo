let imageData;
let groups = {};
let loadedImages = {};
let thumbnails = [];
let showHomepage = true;
let showGallery = false;
let backButton;
let searchInput;
let currentPeriod = null;

const thumbnailSize = 250;
const maxImageSize = 512;

let bookColors = {};
let shelfMargin = 20; // Adjust shelf margin as needed

let carouselOffset = 0;  // To control the horizontal scroll position
let scrollSpeed = 5;  // Speed of the scrolling when flipping pages
let maxScroll = 0;  // Maximum scroll limit (end of the gallery)
let minScroll = 0;  // Minimum scroll limit (start of the gallery)
let currentIndex = 0;
let currentThumbnailIndex = 0;

let currentStage = 'home'; // could be 'home', 'album', 'imageDetail'
let selectedImage = null;
let backButtonHovered = false;

let isEditing = false;
let editedDescription = "";


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

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(16);
  textAlign(LEFT, TOP);

  categorizeImages();

  // Search bar
  searchInput = createInput();
  searchInput.position(width / 2 - 250, 30); // Centered horizontally
  searchInput.size(500); // Longer size
  searchInput.attribute("placeholder", "Search by tag or description...");
  searchInput.input(handleSearch);

  // Apply rounded edges using CSS
  searchInput.style('border-radius', '16px');
  searchInput.style('padding', '10px');
}

function categorizeImages() {
  imageData.sort((a, b) => new Date(b.date) - new Date(a.date));
  for (let img of imageData) {
    let date = new Date(img.date);
    let year = date.getFullYear();
    if (!groups[year]) groups[year] = [];
    groups[year].push(img);
  }

}

function handleSearch() {
  const query = searchInput.value().toLowerCase();
  if (query.trim() === "") {
    categorizeImages();
    currentStage = 'home';
    return;
  }

  const results = imageData.filter((img) => {
    const desc = img.description?.toLowerCase() || "";
    const tags = (img.tags || []).map((tag) => tag.toLowerCase());
    return desc.includes(query) || tags.some((tag) => tag.includes(query));
  });

  groups = { Search: results };
  currentPeriod = "Search";
  currentStage = 'album';
}


function draw() {
  background(20);

  if (showHomepage) {
    displayAlbums();
  } else if (showGallery) {
    displayThumbnails(); // Gallery display logic
    drawBackButton();
  }else {
    displayImageDetail();
    drawBackButton();

  }
}

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

function displayAlbums() {
  // Clear the entire canvas to reset everything
  clear(); 

  // Ensure that the canvas dimensions are consistent
  resizeCanvas(windowWidth, windowHeight);  // Adjust if needed for your specific layout

  // Reset positions for the books and text every time this function is called
  let bookX = 40;
  let bookY = 100;

  console.log('Starting position: bookX =', bookX, ', bookY =', bookY);

  // Store book positions to avoid misalignment when navigating back
  bookPositions = [];

  // Iterate over the albums (groups)
  for (let i = 0; i < Object.keys(groups).length; i++) {
    let period = Object.keys(groups)[i];
    let albumImages = groups[period];
    let numImages = albumImages.length;

    // Calculate the book width and height
    let bookWidth = 60 + numImages * 2;
    let bookHeight = 240;

    // Determine the fade effect based on the album's year
    let year = parseInt(period);
    let ageFactor = (new Date().getFullYear() - year) / 50;
    let baseColor = color(
      lerp(120, 180, ageFactor),
      lerp(60, 100, ageFactor),
      lerp(50, 80, ageFactor)
    );

    let isHovered =
      mouseX > bookX && mouseX < bookX + bookWidth &&
      mouseY > bookY && mouseY < bookY + bookHeight;

    let displayColor = isHovered
      ? lerpColor(baseColor, color(255), 0.3)
      : baseColor;

    // Draw the shadow when hovered
    if (isHovered) {
      fill(0, 50);
      noStroke();
      rect(bookX + 5, bookY + 5, bookWidth, bookHeight, 5);
    }

    // Draw the book cover (rectangle)
    fill(displayColor);
    noStroke();
    rect(bookX, bookY, bookWidth, bookHeight, 5);

    // Draw the book spine
    fill(100);
    rect(bookX + bookWidth - 10, bookY, 10, bookHeight, 3);

    // Explicitly draw the text and ensure correct position
    // Explicitly draw the text and ensure correct position
    fill(255);
    push();
    // Center the text on the book, but offset it a bit higher and to the right
    let offsetX = 10; // Right offset
    let offsetY = -10; // Upward offset
    translate(bookX + bookWidth / 2 + offsetX, bookY + bookHeight - 20 + offsetY);
    rotate(-HALF_PI);  // Rotate the text to be upright
    textAlign(CENTER, CENTER);  // Ensure the text is centered
    text(period, 0, 0);  // Draw text
    pop();

    // Store book position for later click detection
    bookPositions.push({ x: bookX, y: bookY, w: bookWidth, h: bookHeight, period });

    // Update the position for the next book
    bookX += bookWidth + 20;

    // Move to the next row if the books exceed the canvas width
    if (bookX > width - bookWidth) {
      bookX = 40;
      bookY += bookHeight + shelfMargin;
    }
  }

  console.log('End position: bookX =', bookX, ', bookY =', bookY);
}


function displayThumbnails() {
  thumbnails = [];
  
  if (!groups[currentPeriod]) return;

  // Starting Y position to center thumbnails vertically (you can adjust this)
  let thumbY = height / 2 - thumbnailSize / 2;

  // Total width of all thumbnails including spacing
  let totalWidth = groups[currentPeriod].length * (thumbnailSize + 10) - 10;

  // Start X so the row is horizontally centered
  let startX = 0;

  push(); // Save drawing state
  translate(-carouselOffset, 0); // Apply horizontal scrolling

  let thumbX = startX;  // Renamed 'x' to 'thumbX' for clarity
  for (let img of groups[currentPeriod]) {
    let p5img = loadedImages[img.src];
    let centerX = width / 2;
    let thumbCenterX = thumbX - carouselOffset + thumbnailSize / 2;
    let distanceToCenter = abs(centerX - thumbCenterX);
    let scaleFactor = map(distanceToCenter, 0, width / 2, 1.2, 0.8);
    scaleFactor = constrain(scaleFactor, 0.8, 1.2);

    let squareSize = thumbnailSize * scaleFactor;

    let sx = 0, sy = 0, sw = p5img.width, sh = p5img.height;
    if (sw > sh) {
      sx = (sw - sh) / 2;
      sw = sh;
    } else {
      sy = (sh - sw) / 2;
      sh = sw;
    }

    let adjustedY = thumbY + (thumbnailSize - squareSize) / 2;
    image(p5img, thumbX, adjustedY, squareSize, squareSize, sx, sy, sw, sh);

    thumbnails.push({
      x: thumbX,
      y: thumbY,
      size: squareSize,
      img: p5img,
      src: img.src,
    });

    thumbX += squareSize + 10;
  }

  pop(); // Restore drawing state

  // Calculate maxScroll
  maxScroll = Math.max(0, totalWidth - width + 40);

  // Draw carousel navigation buttons
  drawCarouselNavButtons();
}

function drawCarouselNavButtons() {
  // Draw the "previous" button
  fill(255);
  rect(20, height / 2 - 30, 60, 60, 10);
  fill(0);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("<", 50, height / 2);

  // Draw the "next" button
  fill(255);
  rect(width - 80, height / 2 - 30, 60, 60, 10);
  fill(0);
  textSize(24);
  textAlign(CENTER, CENTER);
  text(">", width - 50, height / 2);
}

function mousePressed() {
  // Clicking on the homepage
  if (showHomepage) {
    for (let book of bookPositions) {
      if (
        mouseX > book.x &&
        mouseX < book.x + book.w &&
        mouseY > book.y &&
        mouseY < book.y + book.h
      ) {
        // Open the selected album
        currentPeriod = book.period;
        showHomepage = false;
        showGallery = true;
        currentStage = 'album'; // Set the stage to 'album'
        return;
      }
    }
  
  }
  if (currentStage === 'imageDetail' && this.editButtonArea) {
    let { x, y, w, h } = this.editButtonArea;
    if (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h) {
      if (isEditing) {
        // Save changes
        let selected = imageData.find(img => loadedImages[img.src] === selectedImage);
        if (selected && this.descInput) {
          selected.description = this.descInput.value();
          saveJSON(imageData, "metadata.json");  // This won't work in browser only!
        }
      }
      isEditing = !isEditing;
      return;
    }
  }
  
  // Handle the back button click
  if (backButtonHovered) {
    if (currentStage === 'imageDetail') {
      // If in the image detail view, go back to the gallery view
      currentStage = 'album';
      showGallery = true;
      selectedImage = null; // Deselect the image
    } else if (currentStage === 'album') {
      // If in the album view, go back to the homepage
      currentStage = 'home';
      currentPeriod = null; // Reset the current period
      showGallery = false; // Hide the gallery
      showHomepage = true; // Show the homepage
      carouselOffset = 0; // Reset the carousel offset
      currentThumbnailIndex = 0; // Reset the thumbnail index
    }
  }

  // Handle gallery and thumbnail clicks
  if (showGallery) {
    // Left arrow click
    if (mouseX > 20 && mouseX < 80 && mouseY > height / 2 - 30 && mouseY < height / 2 + 30) {
      currentThumbnailIndex = max(0, currentThumbnailIndex - 1);
      centerThumbnail(currentThumbnailIndex);
      return;
    }
  
    // Right arrow click
    if (mouseX > width - 80 && mouseX < width - 20 && mouseY > height / 2 - 30 && mouseY < height / 2 + 30) {
      if (groups[currentPeriod]) {
        currentThumbnailIndex = min(groups[currentPeriod].length - 1, currentThumbnailIndex + 1);
        centerThumbnail(currentThumbnailIndex);
      }
      return;
    }
  
    // Image click detection
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
        currentStage = 'imageDetail'; // Set the stage to 'imageDetail'
        window.scrollTo(0, 0);
        return;
      }
    }
  }
}

function mouseWheel(event) {
  // Check the direction of the scroll
  if (event.delta > 0) {
    // Scroll down (rightward in the carousel)
    if (carouselOffset < maxScroll) {
      carouselOffset += (thumbnailSize + 10);
    } else {
      carouselOffset = 0; // Loop back to the first image
    }
  } else {
    // Scroll up (leftward in the carousel)
    if (carouselOffset > 0) {
      carouselOffset -= (thumbnailSize + 10);
    } else {
      carouselOffset = maxScroll; // Loop back to the last image
    }
  }
  return false; // Prevent default scrolling behavior
}

function centerThumbnail(index) {
  if (!groups[currentPeriod]) return;

  const spacing = thumbnailSize + 10;
  const totalImages = groups[currentPeriod].length;
  const totalWidth = totalImages * spacing - 10;

  const centerOfCanvas = width / 2;
  const targetThumbnailX = index * spacing;

  let desiredOffset = targetThumbnailX - centerOfCanvas + thumbnailSize / 2;

  // Clamp the offset to stay within scrollable bounds
  desiredOffset = constrain(desiredOffset, 0, max(0, totalWidth - width));

  carouselOffset = desiredOffset;
}

function displayImageDetail() {
  let maxSide = 512;
  let w = selectedImage.width;
  let h = selectedImage.height;

  if (w > h) {
    w = maxSide;
    h = (selectedImage.height * maxSide) / selectedImage.width;
  } else {
    h = maxSide;
    w = (selectedImage.width * maxSide) / selectedImage.height;
  }

  // Increase verticalSpacing to move all content down by 25px
  let verticalSpacing = 45; // Increased from 20 to 45
  let padding = 15;

  fill(0, 0, 0, 100);
  rect(10 + 5, 30 + 5 + verticalSpacing, w + 20, h + 20);
  fill(255);
  rect(10, 30 + verticalSpacing, w + 20, h + 20);
  image(selectedImage, 20, 40 + verticalSpacing, w, h);

  let selected = imageData.find(
    (img) => loadedImages[img.src] === selectedImage
  );

  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);

  let descriptionY = 40 + verticalSpacing;
  text("Description:", w + 40, descriptionY);

  textSize(14);
  let descTextY = descriptionY + 30;

  if (isEditing) {
    // Editable input box
    if (!this.descInput) {
      this.descInput = createInput(selected.description || "");
      this.descInput.position(w + 40, descTextY);
      this.descInput.size(width - w - 80);
    }
  } else {
    // Show static description
    text(selected.description || "No description available.", w + 40, descTextY, width - w - 80);
    if (this.descInput) {
      this.descInput.remove();
      this.descInput = null;
    }
  }

    text(
      selected.description || "No description available.",
      w + 40,
      descTextY,
      width - w - 80
    );

    let tagsLabelY = descTextY + 100;
    textSize(16);
    text("Tags:", w + 40, tagsLabelY);

    textSize(14);
    let tagY = tagsLabelY + 30; // Ensure tags appear clearly below the "Tags:" label
    let tagX = w + 40;

    const tagStyle = {
      fill: color(255, 255, 255),
      background: color(0, 102, 204),
      borderRadius: 12,
      padding: { x: 12, y: 8 },
      marginRight: 12,
      fontSize: 14,
    };

    if (selected.tags && selected.tags.length > 0) {
      selected.tags.forEach((tag) => {
        let tagWidth = textWidth(tag) + tagStyle.padding.x * 2;
        let tagHeight = tagStyle.padding.y * 2;

        fill(tagStyle.background);
        noStroke();
        rect(tagX, tagY, tagWidth, tagHeight, tagStyle.borderRadius);

        fill(tagStyle.fill);
        textAlign(LEFT, CENTER);
        text(tag, tagX + tagStyle.padding.x, tagY + tagStyle.padding.y);

        tagX += tagWidth + tagStyle.marginRight;
      });
    } else {
      text("No tags available.", tagX, tagY);
    }
    let buttonY = tagY + 50;
    fill(100);
    rect(w + 40, buttonY, 120, 35, 8);
    fill(255);
    textAlign(CENTER, CENTER);
    text(isEditing ? "Save" : "Edit", w + 100, buttonY + 17);

    // Save click area for later detection
    this.editButtonArea = { x: w + 40, y: buttonY, w: 120, h: 35 };

}

