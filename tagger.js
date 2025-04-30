// tagger.js

let winkPosTagger;
let taggerReady = false;
let nounTags = ["NN", "NNS", "NNP", "NNPS"];

// Load the POS tagger asynchronously
async function initTagger() {
  try {
    const module = await import("https://cdn.jsdelivr.net/npm/wink-pos-tagger@2.2.2/+esm");
    winkPosTagger = module.default();
    taggerReady = true;
    console.log("✅ wink-pos-tagger loaded.");
  } catch (error) {
    console.error("❌ Failed to load wink-pos-tagger:", error);
  }
}

// Extract nouns from a sentence
function extractNounsFromText(text) {
  if (!taggerReady || !text) return [];
  const tagged = winkPosTagger.tagSentence(text);
  return tagged
    .filter(word => nounTags.includes(word.pos))
    .map(word => word.value.toLowerCase());
}

// Add new nouns as tags if not already present
function updateTagsFromDescription(imageObj) {
  if (!imageObj || !imageObj.description) return;

  const currentTags = imageObj.tags || [];
  const nouns = extractNounsFromText(imageObj.description);

  // Combine unique new nouns into the tag list
  nouns.forEach(noun => {
    if (!currentTags.includes(noun)) {
      currentTags.push(noun);
    }
  });

  imageObj.tags = currentTags;
}
