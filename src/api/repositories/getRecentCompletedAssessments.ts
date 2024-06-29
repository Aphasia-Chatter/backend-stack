import { db } from "src/db";
import { wordRetrievalSession } from "src/schema";
import { eq } from "drizzle-orm";

// Helper function to format the date
function formatDate(dateString: string | null): string {
  if (!dateString) return "No Assessment Date";  // Handle null or undefined dates

  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  // Format the day with suffix (e.g., 1st, 2nd, 3rd, 4th, ...)
  const suffix = day % 10 === 1 && day !== 11 ? 'st' :
                 day % 10 === 2 && day !== 12 ? 'nd' :
                 day % 10 === 3 && day !== 13 ? 'rd' : 'th';

  return `${day}${suffix} ${month} ${year} Assessment`;
}

export default async function getRecentCompletedAssessments(patientId: string) {
  const results = await db.select({
      completedAt: wordRetrievalSession.completedAt
    })
    .from(wordRetrievalSession)
    .where(
      eq(wordRetrievalSession.patientID, patientId)
    )
    .execute();
  
  // Map through the results to format the completed_at values
  const formattedResults = results.map(result => ({
    ...result,
    formattedCompletedAt: formatDate(result.completedAt ? result.completedAt.toString() : null)
  }));

  return formattedResults;
}
