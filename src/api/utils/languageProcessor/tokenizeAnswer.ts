export default function tokenizeAnswer(answer: String) {
    // Function to tokenize the answer (which could be a sentence) into words
    // and convert to lowercase
    const words = answer.split(" ");
    for (let word = 0; word < words.length; word++) {
        words[word] = words[word].toLowerCase()
    }
    return words;
}