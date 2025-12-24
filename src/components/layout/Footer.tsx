import React from "react";
import { Icons } from "../icons";

interface FooterProps {
  onChangeView: (view: "home" | "registry") => void;
}

export const Footer: React.FC<FooterProps> = ({ onChangeView }) => (
  <footer className="footer">
    <div className="container footer-content">
      <div className="footer-col">
        <div className="logo-area">
          <div style={{ width: 26, height: 26, background: "#a4c5f2" }}></div>
          <span>Портал учебных практик</span>
        </div>
        <div style={{ fontSize: "14px", opacity: 0.6, marginTop: "6px" }}>
          информационная система управления <br></br> учебными практиками студентов
        </div>
        <div style={{ marginTop: 30, opacity: 0.4, fontSize: "20px" }}>
          © 2025 Портал учебных практик
        </div>
      </div>
      <div className="footer-col">
        <div className="footer-title">Разделы</div>
        <div className="footer-links">
          <a href="#" onClick={(e) => { e.preventDefault(); onChangeView("home"); }}>Главная</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onChangeView("registry"); }}>Реестр практик</a>
        </div>
      </div>
      <div className="footer-col">
        <div className="footer-title">Контакты</div>
        <div className="contact-row">
          <Icons.Mail /> 
          <a href="mailto:qwerty@mail.ru" style={{ textDecoration: 'none', color: 'white' }}>qwerty@mail.ru</a>
        </div>
        <div className="contact-row">
          <Icons.Phone /> 
          <a href="tel:+78005553535" style={{ textDecoration: 'none', color: 'white' }}>+7 (800) 555 35-35</a>
        </div>
      </div>
    </div>
  </footer>
);