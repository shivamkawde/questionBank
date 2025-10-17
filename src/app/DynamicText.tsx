import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function StreamingText({ text, speed = 20 }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + (text?.[i] ?? ""));
      i++;
      if (i >= (text?.length || 0)) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <ReactMarkdown>{displayed}</ReactMarkdown>;
}
