import React, { useState, useEffect } from "react";
import { Practice } from "../../types";
import { StatusBadge } from "../icons";

/**
 * Компонент Главной страницы.
 * Отображает приветствие и список из последних 3-х добавленных практик.
 */
export const MainView: React.FC<{ practices: Practice[] }> = ({ practices }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: isMobile ? "28px" : "40px", fontWeight: 700, color: "#004d33", marginBottom: "10px", padding: "0 10px" }}>
          Единая система управления практиками
        </h1>
        <p style={{ fontSize: isMobile ? "16px" : "22px", color: "#555", maxWidth: "1500px", margin: "0 auto", padding: "0 15px" }}>
          Официальный реестр мест прохождения учебных и производственных практик для студентов и партнеров университета
        </p>
      </div>
      <div className="white-panel">
        <h2>Последние добавленные практики</h2>
        {practices.slice(0, 3).map((p) => (
          <div key={p.id} className="practice-row-main">
            <div>
              <h3 style={{ marginBottom: 15, fontWeight: 400, fontSize: isMobile ? "20px" : "24px" }}>
                {p.studentName}
              </h3>
              <div style={{ color: "#7f8c8d", fontWeight: 400, fontSize: isMobile ? "18px" : "20px" }}>
                {p.company}
              </div>
            </div>
            <StatusBadge status={p.status} />
          </div>
        ))}
      </div>
    </>
  );
};