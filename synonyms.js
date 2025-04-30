// synonyms.js

const synonymCache = {};

async function getSynonyms(word) {
  if (synonymCache[word]) return synonymCache[word];

  try {
    const response = await fetch(`https://api.datamuse.com/words?ml=${word}`);
    const data = await response.json();
    const synonyms = data.slice(0, 5).map(entry => entry.word.toLowerCase());
    synonymCache[word] = synonyms;
    return synonyms;
  } catch (error) {
    console.error(`❌ Failed to fetch synonyms for "${word}"`, error);
    return [];
  }
}
