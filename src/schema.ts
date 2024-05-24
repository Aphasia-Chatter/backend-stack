/*
NOTE:
For namining conventions for custom indexing, include the abbreivation of the table's name at the start,
then column name, then 'idx', all lower-case.

Example, `word_retrieval_session_message` indexes `session_id` column.
Index name should be `wrsm_sessionid_idx`

(`word_retrieval_session_message` -> `wrsm`)
*/

import { integer, pgTable, uuid, text, index, uniqueIndex, varchar, date, timestamp, primaryKey, pgEnum, serial, smallint } from "drizzle-orm/pg-core";

//#region Admin

export const admin = pgTable('admin', {
	id: uuid('id').defaultRandom().primaryKey(),
	username: text('username').notNull().unique(),
	hashedPassword: text('hashed_password').notNull()
}, (admin) => ({
	usernameIDx: index('a_username_idx').on(admin.username),
}));

export const adminSessionToken = pgTable('admin_session_token', {
	token: varchar('token', { length: 256 }).primaryKey(),
	adminID: uuid('admin_id').references(() => admin.id, { onDelete: 'cascade' }).notNull(),
	encryptedClientInformation: text('encrypted_client_info').notNull(),
	lastUsed: timestamp('last_used', { mode: 'date', precision: 0, withTimezone: false }).defaultNow().notNull().$onUpdate(() => new Date()),
	createdAt: timestamp('created_at', { mode: 'date', precision: 0, withTimezone: false }).defaultNow().notNull(),
	expiryDate: timestamp('expiry_date', { mode: 'date', precision: 0, withTimezone: false }),
})

//#endregion


//#region Staff, Patient

export const staff = pgTable('staff', {
	id: uuid('id').defaultRandom().primaryKey(),
	username: text('username').notNull().unique(),
	hashedPassword: text('hashed_password').notNull()
}, (staff) => ({
	usernameIDx: index('s_username_idx').on(staff.username),
}));

export const enrollmentCode = pgTable('enrollment_code', {
	code: varchar('code', { length: 256 }).primaryKey(),
	staffID: uuid('staff_id').references(() => staff.id, { onDelete: 'cascade' }).notNull(),
	patientUsername: text('patient_username').notNull().unique(),
	createdAt: date('created_at', { mode: "date" }).defaultNow().notNull(),
})

export const patient = pgTable('patient', {
	id: uuid('id').defaultRandom().primaryKey(),
	username: text('username').notNull().unique(),
	hashedPassword: text('hashed_password').notNull(),
	enrolledAt: timestamp('enrolled_at', { mode: 'date', precision: 0, withTimezone: false }).defaultNow().notNull()
}, (patient) => ({
	usernameIDx: index('p_username_idx').on(patient.username),
}));

export const patient_staff = pgTable('patient_staff', {
	patientID: uuid('patient_id').references(() => patient.id, { onDelete: 'cascade' }).notNull(),
	staffID: uuid('staff_id').references(() => staff.id, { onDelete: 'cascade' }).notNull(),
	assignedAt: timestamp('assigned_at', { precision: 0, withTimezone: false }).defaultNow().notNull()
}, (table) => {
	return {
		pk: primaryKey({ columns: [table.patientID, table.staffID] }),
	};
})

export const staffSessionToken = pgTable('staff_session_token', {
	token: varchar('token', { length: 256 }).primaryKey(),
	staffID: uuid('staff_id').references(() => staff.id, { onDelete: 'cascade' }).notNull(),
	encryptedClientInformation: text('encrypted_client_info').notNull(),
	lastUsed: timestamp('last_used', { mode: 'date', precision: 0, withTimezone: false }).defaultNow().notNull().$onUpdate(() => new Date()),
	createdAt: timestamp('created_at', { mode: 'date', precision: 0, withTimezone: false }).defaultNow().notNull(),
	expiryDate: timestamp('expiry_date', { mode: 'date', precision: 0, withTimezone: false }),
})

export const patientSessionToken = pgTable('patient_session_token', {
	token: varchar('token', { length: 256 }).primaryKey(),
	patientID: uuid('patient_id').references(() => patient.id, { onDelete: 'cascade' }).notNull(),
	encryptedClientInformation: text('encrypted_client_info').notNull(),
	lastUsed: timestamp('last_used', { mode: 'date', precision: 0, withTimezone: false }).defaultNow().notNull().$onUpdate(() => new Date()),
	createdAt: timestamp('created_at', { mode: 'date', precision: 0, withTimezone: false }).defaultNow().notNull(),
	expiryDate: timestamp('expiry_date', { mode: 'date', precision: 0, withTimezone: false }),
})

//#endregion

export const taskVisibilityEnum = pgEnum('task_visibility_enum', ['unlisted', 'editors_patient_only', 'public']);

export const task = pgTable('task', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull().unique(),
	description: text('description'),
	taskVisibility: taskVisibilityEnum('task_visibility').notNull().default("unlisted"),
	createdAt: timestamp('created_at', { mode: 'date', precision: 0, withTimezone: false }).defaultNow().notNull(),
})

export const taskEditorRoleEnum = pgEnum('task_editor_role_enum', ['none', 'editor', 'owner']);

export const taskEditor = pgTable('task_editor', {
	taskID: uuid('task_id').references(() => task.id, { onDelete: 'cascade' }).notNull(),
	staffID: uuid('staff_id').references(() => staff.id, { onDelete: 'cascade' }).notNull(),
	role: taskEditorRoleEnum("role").default("owner").notNull()
}, (table) => {
	return {
		pk: primaryKey({ columns: [table.taskID, table.staffID] }),
	};
})

//#region Word Retrieval Task

export const wordRetrievalTask = pgTable('word_retrieval_task', {
	taskID: uuid('task_id').references(() => task.id, { onDelete: 'cascade' }).notNull().primaryKey(),
	imagePath: text('image_path').notNull(),
	answer: text('answer').notNull()
})

export const wordRetrievalHintTypeEnum = pgEnum('word_retrieval_hint_type_enum', ['message', 'option_select']);

export const wordRetrievalTaskHint = pgTable('word_retrieval_task_hint', {
	id: smallint('hint_number').notNull(),
	taskID: uuid('task_id').references(() => task.id, { onDelete: 'cascade' }).notNull(),
	content: text('content').notNull(),
	type: wordRetrievalHintTypeEnum('type').notNull()
}, (table) => {
	return {
		pk: primaryKey({ columns: [table.id, table.taskID] }),
	};
})


export const wordRetrievalSession = pgTable('word_retrieval_session', {
	id: uuid('id').defaultRandom().primaryKey(),
	patientID: uuid('patient_id').references(() => patient.id, { onDelete: 'cascade' }).notNull(),
	taskID: uuid('task_id').references(() => wordRetrievalTask.taskID, { onDelete: 'cascade' }).notNull(),
	hintsUsedCount: smallint('hints_used_count').notNull().default(0),
	startedAt: timestamp('started_at', { mode: 'date', precision: 0, withTimezone: false }).defaultNow().notNull(),
	completedAt: timestamp('completed_at', { mode: 'date', precision: 0, withTimezone: false }),
}, (session) => ({
	patientIDx: index('wrs_patientid_idx').on(session.patientID),
	taskIDx: index('wrs_taskid_idx').on(session.taskID)
}))

export const messageAuthorEnum = pgEnum('message_author_enum', ['user', 'system', 'bot']);

export const wordRetrievalSessionMessage = pgTable('word_retrieval_session_message', {
	id: uuid('id').defaultRandom().primaryKey(),
	sessionID: uuid('session_id').references(() => wordRetrievalSession.id, { onDelete: 'cascade' }).notNull(),
	author: messageAuthorEnum('author').notNull(),
	content: text('content').notNull(),
	sentAt: timestamp('sent_at', { mode: 'date', precision: 0, withTimezone: false }).defaultNow().notNull(),
}, (message) => ({
	sessionIDx: index('wrsm_sessionid_idx').on(message.sessionID),
}))


//#endregion