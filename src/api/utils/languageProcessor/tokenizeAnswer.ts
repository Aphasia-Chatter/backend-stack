import {lemmatizer} from "lemmatizer";

export default function tokenizeAnswer(answer: string) {
    // Function to tokenize the answer (which could be a sentence) into words
    // and convert to lowercase
    const words = answer.split(" ");
    for (let word = 0; word < words.length; word++) {
        // Remove special symbols
        words[word] = words[word].replace(/[^a-zA-Z0-9]/g, "");
        // Convert to lowercase
        words[word] = words[word].toLowerCase();
        // Lemmatize the word
        words[word] = lemmatizer(words[word]);
    }
    return words;
}