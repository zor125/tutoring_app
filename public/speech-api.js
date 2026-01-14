window.addEventListener("DOMContentLoaded", () => {
  const recordingButton = document.getElementById("recording-button");
  const transcriptionResult = document.getElementById("transcription-result");
  const summaryButton = document.getElementById("summary-button");
  const summaryResult = document.getElementById("summary-result");

  if (summaryButton) summaryButton.disabled = true;

  let isRecording = false;
  let isSummarizing = false;


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
        summaryButton.disabled = isSummarizing || finalLines.length === 0;
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

    
    const onSummaryClick = async () => {
      const fullScript = finalLines.join("\n").trim();

      if (!summaryResult) return; // 결과 박스가 없으면 종료

      if (!fullScript) {
       summaryResult.textContent = "요약할 내용이 없습니다.";
       return;
      }

      if (!summaryButton) return;

      isSummarizing = true;
      summaryButton.disabled = true;
      summaryButton.textContent = "요약중...";
      summaryResult.textContent = "";

      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ script: fullScript }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "요약 API 호출 실패");
        }

        const data = await res.json();
        summaryResult.textContent = data.summary ?? "(요약 결과가 비어있음)";
      } catch (err) {
        summaryResult.textContent = "에러: " + (err?.message || String(err));
      } finally {
        isSummarizing = false;
        // 스크립트가 있으면 활성, 없으면 비활성
        summaryButton.disabled = finalLines.length === 0;
        summaryButton.textContent = "요약하기";
      }
    };



    recognition.addEventListener("result", onResult);
    recordingButton.addEventListener("click", onClick);
    if (summaryButton) summaryButton.addEventListener("click", onSummaryClick);


  } else {
    recordingButton.remove();
    const message = document.getElementById("error-message");
    message.removeAttribute("hidden");
    message.setAttribute("aria-hidden", "false");
  }
});