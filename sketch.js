//----------Interface----------//

let imageData;
let groups = {};
let loadedImages = {};
let thumbnailSize = 250;
let thumbnails = [];
let selectedImage = null;
let showGallery = true;
let backButton;
const maxImageSize = 512;

function preload() {
  imageData = loadJSON("metadata.json", (data) => {
    imageData = Object.values(data); // ensures array format
    for (let img of imageData) {
      let p5img = loadImage(img.src);
      p5img.resize(maxImageSize, 0);
      loadedImages[img.src] = p5img;
    }
  });
}

function setup() {
  createCanvas(windowWidth, 3700);
  textSize(16);
  textAlign(LEFT, TOP);
  categorizeImages();
  displayThumbnails();

  generateAllDescriptions();

  backButton = createButton("Back to Gallery");
  backButton.position(37, 20);
  backButton.mousePressed(goBackToGallery);
  backButton.hide();
}

function categorizeImages() {
  imageData.sort((a, b) => new Date(b.date) - new Date(a.date));
  for (let img of imageData) {
    let date = new Date(img.date);
    let dateStr = date.toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(img);
  }
}

function displayThumbnails() {
  let x = 20, y = 20;
  thumbnails = [];

  for (let date in groups) {
    fill(0);
    text(date, x, y);
    y += 25;
    for (let img of groups[date]) {
      let p5img = loadedImages[img.src];
      let squareSize = thumbnailSize;

      let sx = 0, sy = 0, sw = p5img.width, sh = p5img.height;
      if (sw > sh) { sx = (sw - sh) / 2; sw = sh; }
      else if (sh > sw) { sy = (sh - sw) / 2; sh = sw; }

      image(p5img, x, y, squareSize, squareSize, sx, sy, sw, sh);
      thumbnails.push({ x, y, size: squareSize, img: p5img, src: img.src });

      x += squareSize + 10;
      if (x > width - 120) { x = 20; y += squareSize + 10; }
    }
    x = 20;
    y += thumbnailSize + 30;
  }
}

function mousePressed() {
  if (showGallery) {
    for (let thumb of thumbnails) {
      if (
        mouseX > thumb.x &&
        mouseX < thumb.x + thumb.size &&
        mouseY > thumb.y &&
        mouseY < thumb.y + thumb.size
      ) {
        selectedImage = thumb.img;
        showGallery = false;
        backButton.show();
        window.scrollTo(0, 0);
        return;
      }
    }
  }
}

function goBackToGallery() {
  showGallery = true;
  selectedImage = null;
  backButton.hide();
}

function draw() {
  background(255);
  if (showGallery) displayThumbnails();
  else if (selectedImage) {
    let maxSide = 512;
    let w = selectedImage.width;
    let h = selectedImage.height;

    if (w > h) {
      w = maxSide;
      h = (selectedImage.height * maxSide) / selectedImage.width;
    }  else {
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
    
      fill(255);
      rect(10, 30, w + 20, h + 20); // Frame for the image
      image(selectedImage, 20, 40, w, h);
    
      // Find imageData for selected image
      let selected = imageData.find(img => loadedImages[img.src] === selectedImage);
      
      if (selected) {
        fill(0);
        textSize(16);
        textAlign(LEFT, TOP);
        text("Description:", w + 40, 40);
        textSize(14);
        text(selected.description || "No description available.", w + 40, 70, width - w - 80); // Wrap text
      }
    }
  };
};