export default async function checkPasswordComplexity(password: string) {
    if (password.length < 8) {
        return 'Password must be at least 8 characters long.';
    }

    const regexSpecial = /[!@#$%^&*(),.?":{}|<>]/;
    const regexUppercase = /[A-Z]/;
    const regexLowercase = /[a-z]/;
    const regexDigit = /[0-9]/;

    let complexityCriteria = 0;
    if (regexSpecial.test(password)) complexityCriteria++;
    if (regexUppercase.test(password)) complexityCriteria++;
    if (regexLowercase.test(password)) complexityCriteria++;
    if (regexDigit.test(password)) complexityCriteria++;

    if (complexityCriteria < 3) {
    return 'Password must contain at least three of the following: an uppercase letter, a lowercase letter, a digit, a special character.';
    }

    return 'Password is strong.';
}