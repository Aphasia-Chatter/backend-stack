import { db } from 'src/db';
import { staff } from "src/schema";
import { eq } from "drizzle-orm";

// Function to retrieve staff hashed password based on username
export default async function getStaffPassword(username: string) {
    try {
        const result = await db.select({
            hashedPassword: staff.hashedPassword
        }).from(staff).where(eq(staff.username, username)).limit(1);

        if (result.length > 0) {
            return result[0].hashedPassword;
        } else {
            throw new Error('Staff username not found.');
        }
    } catch (error) {
        console.error('Error fetching staff hashed password:', error);
        throw error;
    }
}
