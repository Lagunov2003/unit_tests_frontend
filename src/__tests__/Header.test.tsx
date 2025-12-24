import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "../components/layout/Header"; 

describe("Header Component", () => {
  const mockOnChangeView = jest.fn();
  const mockOnAddClick = jest.fn();

  const defaultProps = {
    currentView: "home" as const,
    onChangeView: mockOnChangeView,
    onAddClick: mockOnAddClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Рендеринг компонента", () => {
    it("должен корректно отображать все основные элементы", () => {
      render(<Header {...defaultProps} />);

      // Проверка логотипа
      expect(screen.getByText("Портал учебных практик")).toBeInTheDocument();
  

      // Проверка навигационных кнопок
      expect(screen.getByText("Главная")).toBeInTheDocument();
      expect(screen.getByText("Реестр практик")).toBeInTheDocument();

      // Проверка кнопки добавления
      expect(screen.getByText("+ Добавить практику")).toBeInTheDocument();
    });

    it("должен показывать активное состояние для кнопки 'Главная' при currentView='home'", () => {
      render(<Header {...defaultProps} />);

      const homeButton = screen.getByText("Главная");
      const registryButton = screen.getByText("Реестр практик");

      expect(homeButton).toHaveClass("active");
      expect(registryButton).not.toHaveClass("active");
    });

    it("должен показывать активное состояние для кнопки 'Реестр практик' при currentView='registry'", () => {
      render(<Header {...defaultProps} currentView="registry" />);

      const homeButton = screen.getByText("Главная");
      const registryButton = screen.getByText("Реестр практик");

      expect(homeButton).not.toHaveClass("active");
      expect(registryButton).toHaveClass("active");
    });
  });

  describe("Взаимодействие с пользователем", () => {
    it("должен вызывать onChangeView с 'home' при клике на кнопку 'Главная'", () => {
      render(<Header {...defaultProps} currentView="registry" />);

      const homeButton = screen.getByText("Главная");
      fireEvent.click(homeButton);

      expect(mockOnChangeView).toHaveBeenCalledTimes(1);
      expect(mockOnChangeView).toHaveBeenCalledWith("home");
    });

    it("должен вызывать onChangeView с 'registry' при клике на кнопку 'Реестр практик'", () => {
      render(<Header {...defaultProps} currentView="home" />);

      const registryButton = screen.getByText("Реестр практик");
      fireEvent.click(registryButton);

      expect(mockOnChangeView).toHaveBeenCalledTimes(1);
      expect(mockOnChangeView).toHaveBeenCalledWith("registry");
    });

    it("должен вызывать onAddClick при клике на кнопку добавления практики", () => {
      render(<Header {...defaultProps} />);

      const addButton = screen.getByText("+ Добавить практику");
      fireEvent.click(addButton);

      expect(mockOnAddClick).toHaveBeenCalledTimes(1);
    });

  });

  describe("Верстка и CSS классы", () => {
    it("должен иметь правильную структуру классов", () => {
      const { container } = render(<Header {...defaultProps} />);

      // Проверка основных контейнеров
      expect(container.querySelector(".header")).toBeInTheDocument();
      expect(container.querySelector(".container.header-content")).toBeInTheDocument();
      expect(container.querySelector(".logo-area")).toBeInTheDocument();
      expect(container.querySelector(".nav-links")).toBeInTheDocument();
      expect(container.querySelector(".btn-add")).toBeInTheDocument();
    });

    it("должен корректно применять CSS классы к кнопкам навигации", () => {
      const { rerender } = render(<Header {...defaultProps} />);

      let homeButton = screen.getByText("Главная");
      let registryButton = screen.getByText("Реестр практик");

      // Первоначальный рендер с currentView="home"
      expect(homeButton).toHaveClass("active");
      expect(registryButton).not.toHaveClass("active");

      // Ре-рендер с currentView="registry"
      rerender(<Header {...defaultProps} currentView="registry" />);

      homeButton = screen.getByText("Главная");
      registryButton = screen.getByText("Реестр практик");

      expect(homeButton).not.toHaveClass("active");
      expect(registryButton).toHaveClass("active");
    });
  });

  describe("Доступность", () => {
    it("должен иметь кнопки с соответствующими ролями", () => {
      render(<Header {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3); // Главная, Реестр практик, + Добавить практику

      // Проверка текста на кнопках
      expect(screen.getByRole("button", { name: "Главная" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Реестр практик" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "+ Добавить практику" })).toBeInTheDocument();
    });

  });
});