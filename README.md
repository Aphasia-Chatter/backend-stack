# backend-stack

## Some endpoints

### For Transcribing Text

*Endpoint*
```
http://localhost:44818/api/asr/transcribe
```
Method:

`POST`

Body: `multipart/form-data`
```
audioFile: <YOUR FILE>
```

Successful response: `JSON`

```
{
	"status": "SUCCESS",
	"transcription": "TRANSCRIBED TEXT"
}
```

### For Verifying Answer

*Endpoint*
```
http://localhost:44818/api/verify
```

Method:

`POST`

Body: `JSON`

```
{
    "word_retrieval_task_id": "TASK_ID",
    "user_answer": "USER_ANSWER"
}
```

Successful response (Correct Answer): `JSON`

```
{
	"status": "SUCCESS",
	"user_answer": "USER_ANSWER",
	"task": {
		"taskID": "TASK_ID",
		"imagePath": "IMAGE PATH",
		"answer": "TARGET_WORD",
		"inputRestriction": "VOICE_ONLY | TEXT_ONLY | NONE | NULL"
	},
	"correct": <BOOL>,
	"messages": "CONGRATULATORY MESSAGE"
}
```

Successful response (Incorrect Answer): `JSON`

```
{
	"status": "SUCCESS",
	"task": {
		"taskID": "TASK_ID",
		"imagePath": "IMAGE_PATH",
		"answer": "TARGET_WORD",
		"inputRestriction": "VOICE_ONLY | TEXT_ONLY | NONE | NULL"
	},
	"correct": false,
	"cues": [
		{
			"id": 0,
			"taskID": "TASK_ID",
			"content": "CUE 1",
			"type": "message",
			"hierarchyNum": <HIERARCHY_NUMBER>
		},
		{
			"id": 1,
			"taskID": "TASK_ID",
			"content": "CUE 2",
			"type": "message",
			"hierarchyNum": <HIERARCHY_NUMBER>
		},
		...
	]
}
```

### For Generating Cues

```
http://localhost:44818/api/generate-cue
```

Method:

`POST`

Body: `JSON`

```
{
    "word_retrieval_task_id": "WORD_RETRIEVAL_TASK_ID",
    "num_cues": <NUMBER OF CUES>,
    "hierarchy_num": <HIERARCHY NUMBER>
}
```

Successful response: `JSON`

```
{
	"status": "SUCCESS",
	"message": "Type <HIERARCHY> hierarchy cues generated successfully.",
	"num_cues": <NUMBER OF CUES>
}
```