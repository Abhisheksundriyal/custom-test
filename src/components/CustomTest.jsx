import React, { useEffect, useState } from "react";
import "./CustomTest.css";
import "katex/dist/katex.min.css";
import TeX from "@matejmazur/react-katex";

const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

function renderTextWithMath(text) {
  return text.split("\n\n").map((paragraph, pIdx) => {
    const parts = paragraph.split(/(\$\$[^$]*\$\$|\$[^$]*\$|\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\})/g);

    return (
      <p key={pIdx}>
        {parts.map((part, i) => {
          if (part.startsWith("$$") && part.endsWith("$$")) {
            // Block math with $$
            return <TeX key={`${pIdx}-${i}`} block math={part.slice(2, -2)} />;
          } else if (part.startsWith("\\begin") && part.includes("\\end")) {
            // Block math with \begin...\end
            return <TeX key={`${pIdx}-${i}`} block math={part} />;
          } else if (part.startsWith("$") && part.endsWith("$")) {
            // Inline math
            return <TeX key={`${pIdx}-${i}`} math={part.slice(1, -1)} />;
          } else {
            return <span key={`${pIdx}-${i}`}>{part}</span>;
          }
        })}
      </p>
    );
  });
}





function CustomTest() {
  const [mapData, setMapData] = useState({});
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  useEffect(() => {
    fetch("/data/map.json")
      .then((res) => res.json())
      .then((data) => setMapData(data));
  }, []);

  useEffect(() => {
    const savedTest = localStorage.getItem("custom-test");
    if (savedTest) {
      const data = JSON.parse(savedTest);
      setQuestions(data.questions);
      setCurrentIndex(data.currentIndex);
      setTestStarted(true);
    }
  }, []);

  useEffect(() => {
    if (testStarted && questions.length > 0) {
      localStorage.setItem(
        "custom-test",
        JSON.stringify({ questions, currentIndex })
      );
    }
  }, [questions, currentIndex, testStarted]);

  const addToList = (item, list, setList) => {
    if (item && !list.includes(item)) {
      setList([...list, item]);
    }
  };

  const removeFromList = (item, list, setList) => {
    if (setList === setSubjects) {
      setChapters((prev) => prev.filter((c) => !c.startsWith(`${item}:`)));
      setExercises((prev) => prev.filter((e) => !e.startsWith(`${item}:`)));
    }

    if (setList === setChapters) {
      setExercises((prev) => prev.filter((e) => !e.startsWith(`${item}:`)));
    }

    setList(list.filter((i) => i !== item));
  };

  const clearAllSelections = () => {
    setSubjects([]);
    setChapters([]);
    setExercises([]);
    setSelectedSubject("");
    setSelectedChapter("");
    setSelectedExercise("");
  };

  const getSelectedExercises = () => {
  const result = [];

  for (let i = 0; i < subjects.length; i++) {
    const subj = subjects[i];
    const chaptersInSubject = mapData[subj] || {};

    const chapterKeys = Object.keys(chaptersInSubject);
    for (let j = 0; j < chapterKeys.length; j++) {
      const chapter = chapterKeys[j];
      const exercisesInChapter = chaptersInSubject[chapter];

      const chapterKey = `${subj}:${chapter}`;
      if (chapters.includes(chapterKey)) {
        const exerciseKeys = Object.keys(exercisesInChapter);
        for (let k = 0; k < exerciseKeys.length; k++) {
          const exercise = exerciseKeys[k];
          const files = exercisesInChapter[exercise];

          const exerciseKey = `${subj}:${chapter}:${exercise}`;
          if (exercises.includes(exerciseKey)) {
            result.push({
              subject: subj,
              chapter,
              exercise,
              files,
            });
          }
        }
      }
    }
  }

  return result;
};


const startTest = async () => {
  const selected = getSelectedExercises();
  let fetchedQuestions = [];

  for (let i = 0; i < selected.length; i++) {
    const subject = selected[i].subject;
    const chapter = selected[i].chapter;
    const exercise = selected[i].exercise;
    const files = selected[i].files;

    for (let j = 0; j < files.length; j++) {
      const file = files[j];
      const path = `/data/subjects/${subject}/${chapter}/${exercise}/${file}`;

      try {
        const res = await fetch(path);
        const json = await res.json();
        fetchedQuestions.push({
          ...json,
          source: `${subject}/${chapter}/${exercise}/${file}`,
        });
      } catch (e) {
        console.warn("Skipped invalid question file:", path);
      }
    }
  }

  const uniqueQuestions = shuffleArray(fetchedQuestions).slice(
    0,
    Math.min(questionCount, 25)
  );

  setQuestions(uniqueQuestions);
  setCurrentIndex(0);
  setShowSolution(false);
  setTestStarted(true);

  localStorage.setItem(
    "custom-test",
    JSON.stringify({ questions: uniqueQuestions, currentIndex: 0 })
  );
};


  const endTest = () => {
    setTestStarted(false);
    setQuestions([]);
    setCurrentIndex(0);
    setShowSolution(false);
    localStorage.removeItem("custom-test");
  };

  if (testStarted && questions.length > 0) {
    const current = questions[currentIndex];
    return (
      <div className="custom-test">
        <h2>
          Question {currentIndex + 1} of {questions.length}
        </h2>
        <div className="question">{renderTextWithMath(current.question)}</div>

        {showSolution && (
          <div className="solution">
            <strong>Solution:</strong>
            <p>{renderTextWithMath(current.solution)}</p>
          </div>
        )}

        <div className="controls">
          <button
            onClick={() => {
              setCurrentIndex((i) => i - 1);
              setShowSolution(false);
            }}
            disabled={currentIndex === 0}
          >
            Previous
          </button>

          <button
            onClick={() => {
              setCurrentIndex((i) => i + 1);
              setShowSolution(false);
            }}
            disabled={currentIndex === questions.length - 1}
          >
            Next
          </button>

          <button onClick={() => setShowSolution(!showSolution)}>
            {showSolution ? "Hide Solution" : "Show Solution"}
          </button>

          <button onClick={endTest}>End Test</button>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-test">
      <h2>Create Custom Test</h2>

      {/* SUBJECT */}
      <div className="select-group">
        <h3>Select Subject</h3>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">-- Select Subject --</option>
          {Object.keys(mapData).map((subj) => (
            <option key={subj} value={subj}>
              {subj}
            </option>
          ))}
        </select>
        <button onClick={() => addToList(selectedSubject, subjects, setSubjects)}>
          Add
        </button>
        <ul>
          {subjects.map((s) => (
            <li key={s}>
              {s}{" "}
              <button onClick={() => removeFromList(s, subjects, setSubjects)}>
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* CHAPTER */}
      <div className="select-group">
        <h3>Select Chapter</h3>
        <select
          value={selectedChapter}
          onChange={(e) => setSelectedChapter(e.target.value)}
        >
          <option value="">-- Select Chapter --</option>
          {subjects.flatMap((subj) =>
            Object.keys(mapData[subj] || {}).map((chap) => {
              const key = `${subj}:${chap}`;
              return (
                <option key={key} value={key}>
                  {key}
                </option>
              );
            })
          )}
        </select>
        <button onClick={() => addToList(selectedChapter, chapters, setChapters)}>
          Add
        </button>
        <ul>
          {chapters.map((c) => (
            <li key={c}>
              {c}{" "}
              <button onClick={() => removeFromList(c, chapters, setChapters)}>
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* EXERCISE */}
      <div className="select-group">
        <h3>Select Exercise</h3>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
        >
          <option value="">-- Select Exercise --</option>
          {chapters.flatMap((chapterKey) => {
            const [subj, chap] = chapterKey.split(":");
            return Object.keys(mapData[subj]?.[chap] || {}).map((ex) => {
              const key = `${subj}:${chap}:${ex}`;
              return (
                <option key={key} value={key}>
                  {key}
                </option>
              );
            });
          })}
        </select>
        <button onClick={() => addToList(selectedExercise, exercises, setExercises)}>
          Add
        </button>
        <ul>
          {exercises.map((e) => (
            <li key={e}>
              {e}{" "}
              <button onClick={() => removeFromList(e, exercises, setExercises)}>
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* QUESTION COUNT */}
      <div className="select-group">
        <label>
          Number of Questions (max 25):{" "}
          <input
            type="number"
            value={questionCount}
            min={1}
            max={25}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
          />
        </label>
      </div>

      <button onClick={startTest} className="start-btn">
        Start Test
      </button>
      <button onClick={clearAllSelections} className="clear-btn">
        Clear All
      </button>
    </div>
  );
}

export default CustomTest;


