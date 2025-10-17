// src/components/QuestionViewer.jsx

import React from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

function renderContent(content) {
  if (typeof content === "string") {
    const paragraphs = content.split(/\n\s*\n/); // Split at double newlines

    return paragraphs.map((para, paraIndex) => {
      const parts = para.split(
        /(\$\$[^$]*\$\$|\$[^$]*\$|\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\})/g
      );

      return (
        <p key={paraIndex} style={{ marginBottom: "1em" }}>
          {parts.map((part, index) => {
            if (part.startsWith("$$") && part.endsWith("$$")) {
              // Block math with $$...$$
              return <BlockMath key={index} math={part.slice(2, -2)} />;
            } else if (part.startsWith("\\begin") && part.includes("\\end")) {
              // Block math with \begin...\end
              return <BlockMath key={index} math={part} />;
            } else if (part.startsWith("$") && part.endsWith("$")) {
              // Inline math with $...$
              return <InlineMath key={index} math={part.slice(1, -1)} />;
            } else {
              return <span key={index}>{part}</span>;
            }
          })}
        </p>
      );
    });
  }

  if (Array.isArray(content)) {
    return content.map((item, index) => <div key={index}>{renderContent(item)}</div>);
  }

  if (typeof content === "object" && content.type === "math") {
    return <BlockMath math={content.value} />;
  }

  return null;
}

export default function QuestionViewer({ questionData }) {
  if (!questionData) return <div>No question loaded</div>;

  return (
    <div className="question-preview">
      <h3>Question:</h3>
      {renderContent(questionData.question)}

      {questionData.options && (
        <>
          <h4>Options:</h4>
          <ul>
            {questionData.options.map((opt, idx) => (
              <li key={idx}>{renderContent(opt)}</li>
            ))}
          </ul>
        </>
      )}

      <h4>Solution:</h4>
      {renderContent(questionData.solution)}
    </div>
  );
}
