"use client";

import { useState } from "react";

export default function PerkSection() {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="w-full">
      <div className="max-w-3xl mx-auto px-8 py-4">
        <div className="py-4">
          <h2 className="text-xl font-bold text-white">강점</h2>
          <p className="mt-2 text-gray-300 whitespace-pre-line">
            - 창의성
            <br />- 책임감
            <br />- 능통한 영어
          </p>
        </div>
        <div className="py-6 cursor-pointer" onClick={() => setIsRevealed(true)}>
          <h2 className="text-xl font-bold text-white">스택</h2>
          <p
            className={`mt-2 whitespace-pre-line transition-all duration-500 ${
              isRevealed ? "text-gray-500 line-through decoration-gray-500" : "text-gray-300"
            }`}
          >
            C<br />C#<br />Java<br />Dart<br />React<br />Flutter
            <br />Next.js
            <br />Python
            <br />Node.js
            <br />JavaScript
            <br />TypeScript
            <br />Firebase Auth
            <br />DB의 SQL 및 CRUD
          </p>
          {isRevealed && (
            <p className="mt-2 text-yellow-400 font-bold text-3xl">
              AI
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
