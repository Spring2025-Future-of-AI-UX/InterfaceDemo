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

        //1sec
        //await delay(1000);

        let description = await generateVisionContent(base64, prompt);
  
        img.description = description;
        //img.tags = extractTagsFromDescription(description); // Still use this if you have the tag function
  
        console.log("Description:", description);
      }
    }
  }


// AI version of simple noun extractors
  
//   function extractNouns(description) {
//     // Simple noun extraction (placeholder for NLP library)
//     const words = description.split(/\s+/);
//     const stopwords = ["the", "a", "of", "is", "in", "on", "and", "to", "with"];
//     return words
//       .filter((word) => /^[A-Za-z]+$/.test(word))
//       .map((word) => word.toLowerCase())
//       .filter((word) => !stopwords.includes(word));
//   }


//Function added in attempt to add delay when generating description for multiple images one after another
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
