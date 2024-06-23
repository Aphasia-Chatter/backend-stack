var w2v = require( 'word2vec' );

w2v.loadModel('path/to/your/model.txt', (err: any, model: any) => {
    console.log(model);
});

function vectorizeToken( token: string ) {
    // Todo
}

export default function compareTokens(tokenVector: string, targetVector: string) {
    // Todo
}