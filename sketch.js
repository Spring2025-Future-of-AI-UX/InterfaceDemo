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

let searchInput;
let searchTerm = "";


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
  createCanvas(windowWidth, 4200);
  textSize(16);
  textAlign(LEFT, TOP);
  categorizeImages();
  displayThumbnails();

  generateAllDescriptions();

  backButton = createButton("Back to Gallery");
  backButton.position(37, 20);
  backButton.mousePressed(goBackToGallery);
  backButton.hide();


  searchInput = createInput();
  searchInput.position(20, 80); // Adjust position if needed
  searchInput.size(300);
  searchInput.position((windowWidth - 300) / 2, 40); // Horizontally center it
  searchInput.attribute("placeholder", "Search by tag or description...");
  searchInput.input(() => {
    searchTerm = searchInput.value().toLowerCase();
    displayThumbnails(); // Re-render on every input change
  });


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
  clear();
  let x = 20, y = 120; // Push content down to avoid overlapping with search bar
  thumbnails = [];

  for (let date in groups) {
    let filteredImages = groups[date].filter(img => {
      const descMatch = img.description?.toLowerCase().includes(searchTerm);
      const tagMatch = img.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
      return descMatch || tagMatch;
    });

    if (filteredImages.length > 0) {
      fill(0);
      text(date, x, y);
      y += 25;

      for (let img of filteredImages) {
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

        // Display tags below the description
        textSize(16);
        text("Tags:", w + 40, h + 70);  // Label for the tags
        textSize(14);
        let tagY = h + 90; // Start displaying tags below description
        if (selected.tags && selected.tags.length > 0) {
          selected.tags.forEach(tag => {
            text("- " + tag, w + 40, tagY);
            tagY += 20;  // Space between each tag
          });
        } else {
          text("No tags available.", w + 40, tagY);
        }
        
      }
    }
  };
};