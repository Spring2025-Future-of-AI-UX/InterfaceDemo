//----------Old Interface----------//

//Image data storing info of source, date (when it was taken), AI generated descriptions, and tags
// Due to API limit, I have to more store the generated content manually in json files so I don't have to regenerate everthing when restart
// let imageData = [
//   { src: "imgs/Img1.jpg", date: "2023-08-19", description: "", tags: [] },
//   { src: "imgs/Img2.jpg", date: "2023-08-19", description: "", tags: [] },
//   { src: "imgs/Img3.jpg", date: "2023-08-19", description: "", tags: [] },
//   { src: "imgs/Img4.jpg", date: "2023-12-01", description: "", tags: [] },
//   { src: "imgs/Img5.jpg", date: "2023-04-08", description: "", tags: [] },
//   { src: "imgs/Img6.jpg", date: "2023-04-08", description: "", tags: [] },
//   { src: "imgs/Img7.jpg", date: "2023-04-08", description: "", tags: [] },
//   { src: "imgs/Img8.jpg", date: "2023-04-08", description: "", tags: [] },
//   { src: "imgs/Img9.jpg", date: "2023-04-08", description: "", tags: [] },
//   { src: "imgs/Img10.jpg", date: "2023-09-21", description: "", tags: [] },
//   { src: "imgs/Img11.jpg", date: "2023-09-27", description: "", tags: [] },
//   { src: "imgs/Img12.jpg", date: "2023-10-13", description: "", tags: [] },
//   { src: "imgs/Img13.jpg", date: "2023-10-20", description: "", tags: [] },
//   { src: "imgs/Img14.jpg", date: "2023-12-01", description: "", tags: [] },
//   { src: "imgs/Img15.jpg", date: "2023-12-12", description: "", tags: [] },
//   { src: "imgs/Img16.jpg", date: "2023-12-13", description: "", tags: [] },
//   { src: "imgs/Img17.jpg", date: "2023-12-14", description: "", tags: [] },
//   { src: "imgs/Img18.jpg", date: "2023-07-05", description: "", tags: [] },
//   { src: "imgs/Img19.jpg", date: "2023-07-06", description: "", tags: [] },
//   { src: "imgs/Img20.jpg", date: "2023-10-13", description: "", tags: [] }
// ];



let groups = {};
let loadedImages = {};
let thumbnailSize = 250;
let thumbnails = [];
let selectedImage = null;
let showGallery = true;
const maxImageSize = 512; // Resize images to max size for API
let backButton;

function preload() {
  for (let img of imageData) {
    // Load the image
    let tempImg = loadImage(img.src);

    // Resize the image to fit within the max size
    tempImg.resize(maxImageSize, 0); // Resizes the longest side to maxImageSize, maintaining aspect ratio
    loadedImages[img.src] = tempImg; // Store the resized image
  }

}

function setup() {
  createCanvas(windowWidth, 3700);
  textSize(16);
  textAlign(LEFT, TOP);
  categorizeImages();
  displayThumbnails();

  generateAllDescriptions();

  // Create a "Back to Gallery" button
  backButton = createButton('Back to Gallery');
  backButton.position(37, 20);  // Top-left corner of the canvas
  backButton.mousePressed(goBackToGallery);
  backButton.hide(); // Hide initially until an image is selected
}

function encodeImg(img) {
  img.loadPixels();
  let imgURL = img.canvas.toDataURL("image/jpeg");
  return imgURL.replace("data:image/jpeg;base64,", "");
}


function categorizeImages() {
  // Sort imageData by date (most recent first)
  imageData.sort((a, b) => new Date(b.date) - new Date(a.date)); // Change this line for most recent first

  // Now categorize the images based on date
  for (let img of imageData) {
    let date = new Date(img.date);
    let dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(img);
  }
}

function displayThumbnails() {
  let x = 20;
  let y = 20;

  thumbnails = [];

  for (let date in groups) {
    fill(0);
    text(date, x, y);
    y += 25;

    for (let img of groups[date]) {
      let p5img = loadedImages[img.src];
      let squareSize = thumbnailSize;

      let sx = 0;
      let sy = 0;
      let sw = p5img.width;
      let sh = p5img.height;

      if (sw > sh) {
        sx = (sw - sh) / 2;
        sw = sh;
      } else if (sh > sw) {
        sy = (sh - sw) / 2;
        sh = sw;
      }

      image(p5img, x, y, squareSize, squareSize, sx, sy, sw, sh);

      thumbnails.push({ x, y, size: squareSize, img: p5img, src: img.src });

      x += squareSize + 10;
      if (x > width - 120) {
        x = 20;
        y += squareSize + 10;
      }
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
        backButton.show(); // Show the "Back to Gallery" button when an image is selected
        
        // Scroll to top when an image is selected
        window.scrollTo(0, 0); // Scroll the page to the top
        return;
      }
    }
  }
}

function goBackToGallery() {
  showGallery = true;
  selectedImage = null;
  backButton.hide(); // Hide the "Back to Gallery" button when back in gallery view
}

function draw() {
  background(255);

  if (showGallery) {
    displayThumbnails();
  } else {
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
    rect(10, 30, w + 20, h + 20); // lightbox frame
    image(selectedImage, 20, 40, w, h);
    fill(0);
    text("Description:", maxImageSize + 40, 40);
    text(selectedImage.description || "Loading...", maxImageSize + 40, 60);
  }
}
