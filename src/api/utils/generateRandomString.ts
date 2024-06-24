import randomString from 'randomized-string';

export default function generateEnrolmentCode(){
    return randomString.generate(8);
}