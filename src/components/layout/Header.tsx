import React from "react";

interface HeaderProps {
  currentView: "home" | "registry";
  onChangeView: (view: "home" | "registry") => void;
  onAddClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onChangeView, onAddClick }) => (
  <header className="header">
    <div className="container header-content">
      <div className="logo-area">
        <div style={{ width: 26, height: 26, background: "#a4c5f2" }}></div>
        <span className="logo-text">Портал учебных практик</span>
      </div>
      <nav className="nav-links">
        <button
          className={currentView === "home" ? "active" : ""}
          onClick={() => onChangeView("home")}
        >
          Главная
        </button>
        <button
          className={currentView === "registry" ? "active" : ""}
          onClick={() => onChangeView("registry")}
        >
          Реестр практик
        </button>
      </nav>
      <button className="btn-add" onClick={onAddClick}>
        + Добавить практику
      </button>
    </div>
  </header>
);