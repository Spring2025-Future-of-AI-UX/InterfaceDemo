// synonyms.js

async function getSynonyms(word) {
    try {
      const response = await fetch(`https://api.datamuse.com/words?ml=${word}`);
      const data = await response.json();
      return data.slice(0, 5).map(entry => entry.word); // top 5 synonyms
    } catch (error) {
      console.error("❌ Failed to fetch synonyms for", word, error);
      return [];
    }
  }
  