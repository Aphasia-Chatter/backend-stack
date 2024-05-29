import randomString from 'randomized-string';

export default function generateSessionToken(){
    return randomString.generate(32);
}