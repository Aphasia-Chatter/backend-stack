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
audioFile: [YOUR FILE]
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
    "word_retrieval_task_id": "WORD_RETRIEVAL_TASK_ID",
    "user_answer": "USER_ANSWER"
}
```

### For Generating Cues

*Semantic Cue Endpoint*
```
http://localhost:44818/api/generate-cue/semantic
```

Method:

`POST`

Body: `JSON`

```
{
    "word_retrieval_task_id": "WORD_RETRIEVAL_TASK_ID",
    "num_cues": 0 [Input the number of cues you want to generate]
}
```

*Phonetic Cue Endpoint*
```
http://localhost:44818/api/generate-cue/phonetic
```

Method:

`POST`

Body: `JSON`

```
{
    "word_retrieval_task_id": "WORD_RETRIEVAL_TASK_ID",
    "num_cues": 0 [Input the number of cues you want to generate]
}
```