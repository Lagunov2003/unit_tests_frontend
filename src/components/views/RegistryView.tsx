import React, { useState, useEffect } from "react";
import { Practice } from "../../types";
import { StatusBadge, Icons } from "../icons";

interface RegistryProps {
  practices: Practice[];
  onOpenFilter: () => void;
  onEdit: (practice: Practice) => void;
}

/**
 * Компонент Реестра практик.
 * Отображает полный список данных в виде таблицы (или карточек на мобильном).
 */
export const RegistryView: React.FC<RegistryProps> = ({ practices, onOpenFilter, onEdit }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const gridHeaders = [
    "Студент", "Вуз", "Факультет", "Вид практики", 
    "Организация", "Статус", "Оценка", "Даты", ""
  ];

  const getPracticeTypeLabel = (practiceType: Practice["practiceType"]): string => {
    switch (practiceType) {
      case "educational": return "Учебная";
      case "postgraduate": return "Преддипломная";
      case "industrial": return "Производственная";
      default: return "Производственная";
    }
  };

  return (
    <div className="registry-container">
      <div className="registry-header">
        <div className="registry-title">
          <h1>Список практик</h1>
          <div className="registry-subtitle">Найдено записей: {practices.length}</div>
        </div>
        <button className="btn-filter" onClick={onOpenFilter}>
          <Icons.Filter /> <span className="filter-text">Фильтрация</span>
        </button>
      </div>

      <div className="registry-table">
        <div className="registry-grid grid-header">
          {gridHeaders.map((header, index) => (
            <div key={index}>{header}</div>
          ))}
        </div>

        {practices.length > 0 ? (
          practices.map((p) => (
            <div key={p.id} className="registry-grid grid-row">
              <div className="col-student" data-label={isMobile ? "Студент:" : undefined}>{p.studentName}</div>
              <div data-label={isMobile ? "Вуз:" : undefined}>{p.university}</div>
              <div data-label={isMobile ? "Факультет:" : undefined}>{p.faculty}</div>
              <div data-label={isMobile ? "Вид практики:" : undefined}>{getPracticeTypeLabel(p.practiceType)}</div>
              <div data-label={isMobile ? "Организация:" : undefined}>{p.company}</div>
              <div data-label={isMobile ? "Статус:" : undefined}><StatusBadge status={p.status} /></div>
              <div data-label={isMobile ? "Оценка:" : undefined}>{p.grade || "-"}</div>
              <div data-label={isMobile ? "Даты:" : undefined}>
                <div style={{ fontSize: "0.85rem" }}>{p.startDate} -<br />{p.endDate}</div>
              </div>
              <div style={{ textAlign: "center" }} data-label={isMobile ? "Действия:" : undefined}>
                <button className="action-btn" onClick={() => onEdit(p)}>
                  <Icons.Edit />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: "#888", gridColumn: "1 / -1" }}>
            По вашим фильтрам ничего не найдено
          </div>
        )}
      </div>
    </div>
  );
};