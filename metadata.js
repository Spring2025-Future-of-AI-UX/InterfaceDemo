//----------Generate and store descriptions----------//
//Still need to work on tags


//Generate descriptions for each img in imageData, used for description to create the json file
async function generateAllDescriptions() {
    for (let img of imageData) {
      if (!img.description || img.description === "") {
        let p5img = loadedImages[img.src];
        let base64 = encodeImg(p5img);
        console.log("Generating for:", img.src);
  
        let prompt = "Describe this image in one sentence.";

        let description = await generateVisionContent(base64, prompt);
  
        img.description = description;
  
        console.log("Description:", description);

      }
    }
}


//Function added in attempt to add delay when generating description for multiple images one after another
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

