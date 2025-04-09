### found this model on youtube: https://www.youtube.com/watch?v=njnbHPRI8fE&t=295s, hugging face: https://huggingface.co/flair/pos-english
## see updated metadata.json for the output tags

import json
from flair.data import Sentence
from flair.models import SequenceTagger

# Load the POS tagger model from Flair
tagger = SequenceTagger.load("flair/pos-english")

def extract_nouns(description):
    # Create a Flair Sentence object from the description
    sentence = Sentence(description)
    
    # Predict POS tags
    tagger.predict(sentence)
    
    # Extract and return all nouns from the sentence
    nouns = []
    for token in sentence:
        if token.get_labels('pos')[0].value in ['NN', 'NNS', 'NNP', 'NNPS']:  # Singular and plural nouns
            nouns.append(token.text)
    
    return nouns

def process_metadata(input_file):
    # Open and load the metadata JSON file
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Process each image in the metadata
    for image in data:
        description = image.get('description', '')
        
        if description:  # Ensure description exists
            # Extract nouns from the description
            nouns = extract_nouns(description)
            
            # Update the tags section with the detected nouns
            image['tags'].extend(nouns)
    
    # Save the updated metadata directly back to the original file
    with open(input_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# Input file
input_file = 'metadata.json'  # Path to your metadata file

# Process the metadata and update the tags directly in the original file
process_metadata(input_file)

