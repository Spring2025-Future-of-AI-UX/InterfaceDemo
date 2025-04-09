### this is AI generated code to test out the "QCRI/bert-base-multilingual-cased-pos-english" model###
## the "test_updated_metadata.json" below is the test output (I renamed manually) for this model
# I decided to move to another model found onlin also in huggingface for part of speech classification



from transformers import AutoTokenizer, AutoModelForTokenClassification, TokenClassificationPipeline
import json
import string

# Load the BERT model for POS tagging
model_name = "QCRI/bert-base-multilingual-cased-pos-english"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForTokenClassification.from_pretrained(model_name)

pipeline = TokenClassificationPipeline(model=model, tokenizer=tokenizer)

def extract_nouns(description):
    # Use the BERT model to extract parts of speech (POS)
    outputs = pipeline(description)
    
    # Print raw output to debug
    print(f"Raw POS Output for description: {description}")
    
    words = []
    current_word = ""
    
    # Combine subwords and filter out unwanted characters
    for item in outputs:
        word = item['word']
        
        # Remove unwanted punctuation and special characters
        if word in string.punctuation or not word.isalpha():
            continue
        
        # Handle special characters or misinterpreted tokens
        if '\u201d' in word or 'sâ€' in word:
            continue
        
        # If it's a subword (starts with '##'), join it with the previous word
        if word.startswith("##"):
            current_word += word[2:]  # Skip '##' and join subwords
        else:
            if current_word:  # If there is a current word being built, add it first
                words.append(current_word)
            current_word = word  # Start a new word with the current token

    # Add the last word being built
    if current_word:
        words.append(current_word)
    
    # Filter out the nouns (tags) based on POS tags from the BERT output
    noun_tags = ['NN', 'NNS', 'NNP']  # Singular, plural, and proper nouns
    tags = [word for word, item in zip(words, outputs) if item['entity'] in noun_tags]
    
    print(f"Extracted Tags: {tags}")  # Print the extracted tags
    return tags

def process_metadata(input_json, output_json):
    # Load the image metadata
    with open(input_json, 'r') as infile:
        image_data = json.load(infile)

    # Process each image
    for img in image_data:
        # Extract and process the description for each image
        description = img.get("description", "")
        if description.strip():  # Check if description is not empty
            # Extract nouns (tags) from the description using the NLP model
            tags = extract_nouns(description)
            img["tags"] = tags
        else:
            img["tags"] = []  # Ensure empty tags for empty descriptions

    # Save the updated image data to a new JSON file
    with open(output_json, 'w') as outfile:
        json.dump(image_data, outfile, indent=4)
    print(f"Updated metadata saved to {output_json}")

# Example usage
input_file = 'metadata.json'  # Your input JSON file
output_file = 'updated_metadata.json'  # The output file with added tags

process_metadata(input_file, output_file)
