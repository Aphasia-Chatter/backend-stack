import { Request, Response } from 'express';
import { db } from 'src/db';
import { wordRetrievalSession, patient, patient_staff, staff } from 'src/schema';
import { eq, inArray, desc, and, isNotNull } from 'drizzle-orm';

function formatDateToReadable(date: Date): string {
    const day = date.getDate();
    const monthNames = [
      "January", "February", "March", "April", "May", "June", "July",
      "August", "September", "October", "November", "December"
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
  
    const suffix = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };
  
    return `${day}${suffix(day)} ${month} ${year}`;
}

export default async function getRecentActivitySummary(req: Request, res: Response) {
  try {
    const username = req.query.username as string; // Assuming username is passed as query parameter
    console.log('param staff username: ', username);

    // Fetch staffId based on username
    const getStaffID = await db
      .select({
        id: staff.id
      })
      .from(staff)
      .where(eq(staff.username, username))

    if (!getStaffID || getStaffID.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    const staffId = getStaffID[0].id;


    // Fetch recent activities for related patient ids
    const recentActivities = await db
    .select({
        patientID: patient_staff.patientID // Replace with correct field name and type
      })
      .from(patient_staff)
      .where(eq(patient_staff.staffID, staffId))
      .execute();

    const patientIds = recentActivities.map((result) => result.patientID);
    console.log('Fetched patient IDs:', patientIds);

    if (patientIds.length === 0) {
        // Handle case where no patient IDs were found
        return res.status(404).json({ error: 'No recent activities found for this staff member.' });
    }

    // Fetch recent activities details
    const recentActivitiesSummary = await db
      .select({
        completedAt: wordRetrievalSession.completedAt,
        patientId: wordRetrievalSession.patientID,
      })
      .from(wordRetrievalSession)
      .where(and(
        inArray(wordRetrievalSession.patientID, patientIds),
        isNotNull(wordRetrievalSession.startedAt),
        isNotNull(wordRetrievalSession.completedAt)
      ))
      .orderBy(desc(wordRetrievalSession.completedAt))
      .execute();

    console.log('Fetched recent activities summary:', recentActivitiesSummary);

    // Prepare grouped activities
    const groupedActivities: { date: string; activities: string[] }[] = [];

    for (const activity of recentActivitiesSummary) {
        if (activity.completedAt) {
          const completedAt = new Date(activity.completedAt);
          const activityDate = formatDateToReadable(completedAt); // Format date
          const patientId = activity.patientId;
  
          // Fetch patient username
          const patientUsernameResult = await db
            .select({
              username: patient.username // Replace with correct field name and type
            })
            .from(patient)
            .where(eq(patient.id, patientId))
            .execute();
  
          const patientUsername = patientUsernameResult.length > 0 ? patientUsernameResult[0].username : 'Unknown Patient';
  
          console.log(`Fetched username for patient ID ${patientId}:`, patientUsername);
  
          // Add activity to groupedActivities
          const index = groupedActivities.findIndex((group) => group.date === activityDate);
          const activityMessage = `Patient ${patientUsername} has completed an assessment`;
  
          if (index === -1) {
            groupedActivities.push({ date: activityDate, activities: [activityMessage] });
          } else {
            groupedActivities[index].activities.push(activityMessage);
          }
        }
      }
  
    return res.status(200).json(groupedActivities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
