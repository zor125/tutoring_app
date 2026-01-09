window.addEventListener("DOMContentLoaded", () => {
  const recordingButton = document.getElementById("recording-button");
  const transcriptionResult = document.getElementById("transcription-result");
  const summaryButton = document.getElementById("summary-button");
  const summaryResult = document.getElementById("summary-result");

  if (summaryButton) summaryButton.disabled = true;

  let isRecording = false;

  let finalLines = [];

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (typeof SpeechRecognition !== "undefined") {//서포트가 된다 = 서포트가 되지 않는 것의 여집합. 서포트 되는 것들을 변수로 추가하는 것보다 제거하는 편이 쉽다.
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.lang = "ko-KR";

    const renderTranscript = (interimText = "") => {
      transcriptionResult.innerHTML = "";

      for (const line of finalLines) {
        const p = document.createElement("p");
        p.textContent = line;
        p.classList.add("final");
        transcriptionResult.appendChild(p);
      }

      if (interimText) {
        const p = document.createElement("p");
        p.textContent = interimText;
        transcriptionResult.appendChild(p);
      }

       if (summaryButton){
        summaryButton.disabled = finalLines.length === 0;
      }
    }

    const onResult = (event) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();
        if (!transcript) continue;

        if (result.isFinal) {
          if (finalLines[finalLines.length - 1] !== transcript) {
            finalLines.push(transcript);
          }
        } else {
          interim = transcript;
        }
      }

      renderTranscript(interim);
    };

    const onClick = (event) => {
      if (isRecording) {
        recognition.stop();
        recordingButton.textContent = "녹음시작";
      } else {
        recognition.start();
        recordingButton.textContent = "녹음중지";
      }
      isRecording = !isRecording;
    };

    
     const onSummaryClick = async (event) => {
      const fullScript = finalLines.join("\n");

      summaryButton.disabled = true;
      summaryButton.textContent = "요약중...";

      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: {"Content-Type": "application/json" },
          body: JSON.stringify({ text: fullScript }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "요약 API 호출 실패");
        }
        const data = await res.json();
        summaryResult.textContent = data.summary;
      } catch (err) {
        summaryResult.textContent = "에러: " + err.message;
      } finally { 
       summaryButton.disabled = false;
       summaryButton.textContent = "요약하기";
       }

    };

    recognition.addEventListener("result", onResult);
    recordingButton.addEventListener("click", onClick);
    recognition.addEventListener("click", onSummaryClick);


  } else {
    recordingButton.remove();
    const message = document.getElementById("error-message");
    message.removeAttribute("hidden");
    message.setAttribute("aria-hidden", "false");
  }
});