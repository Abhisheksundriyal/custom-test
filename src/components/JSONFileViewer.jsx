// src/components/JSONFileViewer.jsx

import React, { useEffect, useState } from "react";
import QuestionViewer from "./QuestionViewer";
import "./JSONFileViewer.css";

export default function JSONFileViewer() {
  const [mapData, setMapData] = useState({});
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [questionData, setQuestionData] = useState(null);

  // Load map.json from public/data
  useEffect(() => {
    fetch("/data/map.json")
      .then((res) => res.json())
      .then(setMapData)
      .catch((err) => console.error("Error loading map.json:", err));
  }, []);

  const loadQuestion = async () => {
    if (!selectedSubject || !selectedChapter || !selectedExercise || !selectedFile) return;

    const path = `/data/subjects/${selectedSubject}/${selectedChapter}/${selectedExercise}/${selectedFile}`;

    try {
      const res = await fetch(path);
      const data = await res.json();
      setQuestionData(data);
    } catch (err) {
      console.error("Failed to load question:", err);
      setQuestionData(null);
    }
  };

  return (
    <div className="json-file-viewer">
      <h2>Preview a Question File</h2>

      {/* Subject dropdown */}
      <select
        value={selectedSubject}
        onChange={(e) => {
          setSelectedSubject(e.target.value);
          setSelectedChapter("");
          setSelectedExercise("");
          setSelectedFile("");
          setQuestionData(null);
        }}
      >
        <option value="">Select Subject</option>
        {Object.keys(mapData).map((subject) => (
          <option key={subject} value={subject}>
            {subject}
          </option>
        ))}
      </select>

      {/* Chapter dropdown */}
      {selectedSubject && (
        <select
          value={selectedChapter}
          onChange={(e) => {
            setSelectedChapter(e.target.value);
            setSelectedExercise("");
            setSelectedFile("");
            setQuestionData(null);
          }}
        >
          <option value="">Select Chapter</option>
          {Object.keys(mapData[selectedSubject] || {}).map((chapter) => (
            <option key={chapter} value={chapter}>
              {chapter}
            </option>
          ))}
        </select>
      )}

      {/* Exercise dropdown */}
      {selectedChapter && (
        <select
          value={selectedExercise}
          onChange={(e) => {
            setSelectedExercise(e.target.value);
            setSelectedFile("");
            setQuestionData(null);
          }}
        >
          <option value="">Select Exercise</option>
          {Object.keys(mapData[selectedSubject]?.[selectedChapter] || {}).map((exercise) => (
            <option key={exercise} value={exercise}>
              {exercise}
            </option>
          ))}
        </select>
      )}

      {/* File dropdown */}
      {selectedExercise && (
        <select
          value={selectedFile}
          onChange={(e) => {
            setSelectedFile(e.target.value);
            setQuestionData(null);
          }}
        >
          <option value="">Select File</option>
          {mapData[selectedSubject]?.[selectedChapter]?.[selectedExercise]?.map((file) => (
            <option key={file} value={file}>
              {file}
            </option>
          ))}
        </select>
      )}

      {/* Load Button */}
      {selectedFile && (
        <button onClick={loadQuestion} style={{ marginLeft: "10px" }}>
          Load Question
        </button>
      )}

      {/* Display question */}
      {questionData && (
        <div className="question-output">
          <QuestionViewer questionData={questionData} />
        </div>
      )}
    </div>
  );
}
